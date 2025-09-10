import jwt from "jsonwebtoken";

export function generateEmailToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.EMAIL_TOKEN_SECRET!, // keep separate from NEXTAUTH_SECRET
    { expiresIn: "1h" }
  );
}

export function verifyEmailToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, process.env.EMAIL_TOKEN_SECRET!) as { userId: string };
  } catch {
    return null;
  }
}
