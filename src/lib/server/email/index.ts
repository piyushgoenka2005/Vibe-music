export {
  MAILBOX,
  formatMailboxFrom,
  getAdminNotificationRecipient,
  mailboxAddress,
  type MailboxKey,
} from "@/lib/server/email/mailboxes";
export {
  getSmtpTransport,
  isSmtpConfigured,
  resetSmtpTransportCache,
  sendMail,
  verifySmtpConnection,
  type SendMailInput,
  type SendMailResult,
} from "@/lib/server/email/smtp";
