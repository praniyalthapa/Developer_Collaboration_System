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
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, code: 1, timedOut, spawnError: true });
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: exitCode ?? 1, timedOut, spawnError: false });
    });
  });

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
        return { output: "Execution timed out (10s limit).", error: true };
      }
      if (last.code !== 0) {
        const combined = `${last.stdout}${last.stderr}`.trim();
        return { output: combined || `Process exited with code ${last.code}`, error: true };
      }
    }

    const output = last ? `${last.stdout}${last.stderr}`.trim() : "";
    return { output: output || "Executed with no output.", error: false };
  } catch (error) {
    logger.error("Code execution failed", error);
    return { output: "Execution failed unexpectedly.", error: true };
  } finally {
    void rm(dir, { recursive: true, force: true });
  }
};
