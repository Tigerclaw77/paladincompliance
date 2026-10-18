// Minimal typing for the subset of nodemailer used by benefits/mailer.ts
// (avoids adding @types/nodemailer as a new dependency).
declare module "nodemailer" {
  type SendMailOptions = {
    from?: string;
    replyTo?: string;
    headers?: Record<string, string>;
    html?: string;
    subject: string;
    text: string;
    to: string;
  };

  type TransportOptions = {
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  };

  type Transporter = {
    sendMail(options: SendMailOptions): Promise<unknown>;
  };

  const nodemailer: {
    createTransport(server: string, defaults?: TransportOptions): Transporter;
  };

  export default nodemailer;
}
