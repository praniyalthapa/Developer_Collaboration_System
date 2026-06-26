import { z } from "zod";
import { objectIdSchema } from "./common";
import { REVIEW_REQUEST_STATUSES, SEND_REQUEST_STATUSES } from "../types/enums";

export const sendRequestParamsSchema = z.object({
  status: z.enum(SEND_REQUEST_STATUSES),
  toUserId: objectIdSchema,
});

export const reviewRequestParamsSchema = z.object({
  status: z.enum(REVIEW_REQUEST_STATUSES),
  requestId: objectIdSchema,
});

export const cancelRequestParamsSchema = z.object({
  requestId: objectIdSchema,
});
