import cron from "node-cron";
import { ConnectionRequest } from "../models/connectionRequest.model";
import { sendMail } from "../utils/mailer";
import { logger } from "../utils/logger";

interface DigestRecipient {
  emailId: string;
  firstName: string;
}

const buildYesterdayRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const sendPendingRequestDigest = async (): Promise<void> => {
  const { start, end } = buildYesterdayRange();

  const requests = await ConnectionRequest.find({
    status: "interested",
    createdAt: { $gte: start, $lte: end },
  }).populate<{ toUserId: DigestRecipient }>("toUserId", "emailId firstName");

  const recipients = new Map<string, { firstName: string; count: number }>();
  for (const request of requests) {
    const recipient = request.toUserId;
    if (!recipient?.emailId) continue;
    const entry = recipients.get(recipient.emailId);
    if (entry) {
      entry.count += 1;
    } else {
      recipients.set(recipient.emailId, {
        firstName: recipient.firstName,
        count: 1,
      });
    }
  }

  for (const [emailId, { firstName, count }] of recipients) {
    await sendMail({
      to: emailId,
      subject: "You have pending connection requests on DevCollab",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;padding:24px;">
          <p>Hi ${firstName},</p>
          <p>You received <strong>${count}</strong> new connection request${count === 1 ? "" : "s"} yesterday. Log in to review and respond.</p>
        </div>
      `,
    });
  }

  logger.info(`Pending request digest processed for ${recipients.size} recipients`);
};

export const startCronJobs = (): void => {
  cron.schedule("0 8 * * *", () => {
    sendPendingRequestDigest().catch((error) =>
      logger.error("Pending request digest failed", error),
    );
  });
  logger.info("Scheduled jobs registered");
};
