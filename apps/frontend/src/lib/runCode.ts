import { apiClient, getErrorMessage } from "./apiClient";
import { runJavaScript, type RunResult } from "./runJs";

export const runCode = async (
  language: string,
  code: string,
): Promise<RunResult> => {
  if (language === "javascript") {
    return runJavaScript(code);
  }

  try {
    const response = await apiClient.post<RunResult>("/execute", { language, code });
    return response.data;
  } catch (error) {
    return { output: getErrorMessage(error, "Execution failed"), error: true };
  }
};
