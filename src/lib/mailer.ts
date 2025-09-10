import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail", // or SMTP config
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Deligo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email - Deligo",
    html: `<p>Click below to verify your email:</p>
           <a href="${url}">${url}</a>`,
  });
}
