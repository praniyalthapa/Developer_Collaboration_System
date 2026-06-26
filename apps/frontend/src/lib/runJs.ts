export interface RunResult {
  output: string;
  error: boolean;
}

const WORKER_SOURCE = `
self.onmessage = (event) => {
  const logs = [];
  const format = (value) => {
    try {
      return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    } catch (_err) {
      return String(value);
    }
  };
  const append = (prefix) => (...args) => logs.push(prefix + args.map(format).join(" "));
  const sandboxConsole = {
    log: append(""),
    info: append(""),
    warn: append("[warn] "),
    error: append("[error] "),
  };
  try {
    const run = new Function("console", event.data);
    run(sandboxConsole);
    self.postMessage({ output: logs.join("\\n") || "Executed with no output.", error: false });
  } catch (err) {
    logs.push(String(err));
    self.postMessage({ output: logs.join("\\n"), error: true });
  }
};
`;

export const runJavaScript = (
  code: string,
  timeoutMs = 3000,
): Promise<RunResult> =>
  new Promise((resolve) => {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve({
        output: "Execution timed out (possible infinite loop).",
        error: true,
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<RunResult>) => {
      window.clearTimeout(timer);
      cleanup();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timer);
      cleanup();
      resolve({ output: event.message, error: true });
    };

    worker.postMessage(code);
  });
