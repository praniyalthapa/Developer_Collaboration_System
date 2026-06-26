import type { Request, Response } from "express";
import { executeSchema } from "../validators/execute.schema";
import { executeCode } from "../services/execute.service";
import { codeExecutionEnabled } from "../config/env";
import { ApiError } from "../utils/apiError";

export const runCode = async (req: Request, res: Response): Promise<void> => {
  if (!codeExecutionEnabled) {
    throw new ApiError(503, "Code execution is disabled on this server");
  }
  const { language, code } = executeSchema.parse(req.body);
  const result = await executeCode(language, code);
  res.json(result);
};
