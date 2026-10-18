// Shared, dependency-free types for subscriber benefit services. These modules
// take their database, mailer and clock as injected dependencies so they can be
// unit-tested without a database or an email provider.

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type Mailer = (message: MailMessage) => Promise<void>;

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "No outbound email provider is configured (set EMAIL_SERVER and EMAIL_FROM)."
    );
    this.name = "EmailNotConfiguredError";
  }
}
