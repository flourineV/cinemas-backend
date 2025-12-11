import nodemailer from "nodemailer";

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  // gửi email
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
    });
  }
}
