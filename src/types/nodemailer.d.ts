// Minimal typing for the subset of nodemailer used by benefits/mailer.ts
// (avoids adding @types/nodemailer as a new dependency).
declare module "nodemailer" {
  type SendMailOptions = {
    from?: string;
    replyTo?: string;
    subject: string;
    text: string;
    to: string;
  };

  type Transporter = {
    sendMail(options: SendMailOptions): Promise<unknown>;
  };

  const nodemailer: {
    createTransport(server: string): Transporter;
  };

  export default nodemailer;
}
