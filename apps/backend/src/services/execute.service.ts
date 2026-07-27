import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { logger } from "../utils/logger";

const TIMEOUT_MS = 10000;
const MAX_OUTPUT = 20000;

export interface ExecuteResult {
  output: string;
  error: boolean;
}

interface Step {
  cmd: string;
  args: string[];
}

interface ExecPlan {
  files: Array<{ name: string; content: string }>;
  steps: Step[];
}

const resolveTsx = (): string => {
  const candidates = [
    path.join(process.cwd(), "node_modules/.bin/tsx"),
    path.join(process.cwd(), "../../node_modules/.bin/tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? "tsx";
};

const buildPlan = (language: string, code: string): ExecPlan | null => {
  switch (language) {
    case "javascript":
      return { files: [{ name: "main.js", content: code }], steps: [{ cmd: "node", args: ["main.js"] }] };
    case "typescript":
      return {
        files: [{ name: "main.ts", content: code }],
        steps: [{ cmd: resolveTsx(), args: ["main.ts"] }],
      };
    case "python":
      return { files: [{ name: "main.py", content: code }], steps: [{ cmd: "python3", args: ["main.py"] }] };
    case "go":
      return { files: [{ name: "main.go", content: code }], steps: [{ cmd: "go", args: ["run", "main.go"] }] };
    case "java":
      // Java 11+ single-file source launch: compiles in memory and runs,
      // so no separate javac (JDK) step is required.
      return {
        files: [{ name: "Main.java", content: code }],
        steps: [{ cmd: "java", args: ["Main.java"] }],
      };
    default:
      return null;
  }
};

interface StepResult {
  stdout: string;
  stderr: string;
  code: number;
  timedOut: boolean;
  spawnError: boolean;
}

const runStep = (step: Step, cwd: string): Promise<StepResult> =>
  new Promise((resolve) => {
    const child = spawn(step.cmd, step.args, {
      cwd,
      env: { ...process.env, GOFLAGS: "-mod=mod" },
      // Run in its own process group so the timeout can kill the whole tree.
      // `go run` compiles then spawns a separate binary; signalling only the
      // direct child leaves that binary alive and spinning forever.
      detached: true,
      // No stdin: a program that reads input gets EOF straight away instead of
      // blocking until the timeout, so `input()` reports EOFError in 0s rather
      // than looking like a 10s hang.
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: StepResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    // Negative pid signals the process group. Falls back to the single child if
    // the group is already gone (ESRCH) or the pid was never assigned.
    const killTree = (): void => {
      if (child.pid === undefined) return;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    };

    const timer = setTimeout(() => {
      killTree();
      // Do not wait for "close" here: it only fires once every stdio pipe has
      // ended, and an orphaned grandchild can hold them open indefinitely,
      // which would hang the HTTP request forever.
      finish({ stdout, stderr, code: 1, timedOut: true, spawnError: false });
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += chunk.toString();
    });
    child.on("error", (err) => {
      finish({ stdout, stderr: err.message, code: 1, timedOut: false, spawnError: true });
    });
    child.on("close", (exitCode) => {
      finish({ stdout, stderr, code: exitCode ?? 1, timedOut: false, spawnError: false });
    });
  });

// Compilers and interpreters report absolute paths inside the scratch dir, e.g.
// `File "/tmp/devcollab-exec-a1b2/main.py", line 3`. Trim the prefix so the
// user sees `File "main.py", line 3` instead of server internals.
const stripScratchPaths = (text: string, dir: string): string =>
  text.split(`${dir}${path.sep}`).join("").split(dir).join("");

export const executeCode = async (
  language: string,
  code: string,
): Promise<ExecuteResult> => {
  const plan = buildPlan(language, code);
  if (!plan) {
    return { output: `Execution is not supported for ${language}.`, error: true };
  }

  const dir = await mkdtemp(path.join(tmpdir(), "devcollab-exec-"));
  try {
    await Promise.all(
      plan.files.map((file) => writeFile(path.join(dir, file.name), file.content)),
    );

    let last: StepResult | null = null;
    for (const step of plan.steps) {
      last = await runStep(step, dir);
      if (last.spawnError) {
        return {
          output: `The "${step.cmd}" runtime is not available on this server.`,
          error: true,
        };
      }
      if (last.timedOut) {
        // Keep whatever the program managed to print — an infinite loop that
        // logs as it spins is far easier to debug with its output attached.
        const partial = stripScratchPaths(`${last.stdout}${last.stderr}`, dir).trim();
        return {
          output: partial
            ? `${partial}\n\nExecution timed out (10s limit).`
            : "Execution timed out (10s limit).",
          error: true,
        };
      }
      if (last.code !== 0) {
        const combined = stripScratchPaths(`${last.stdout}${last.stderr}`, dir).trim();
        return { output: combined || `Process exited with code ${last.code}`, error: true };
      }
    }

    const output = last ? stripScratchPaths(`${last.stdout}${last.stderr}`, dir).trim() : "";
    return { output: output || "Executed with no output.", error: false };
  } catch (error) {
    logger.error("Code execution failed", error);
    return { output: "Execution failed unexpectedly.", error: true };
  } finally {
    void rm(dir, { recursive: true, force: true });
  }
};
