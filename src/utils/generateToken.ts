import jwt, { SignOptions } from "jsonwebtoken"

interface Payload {
  userId?: number | string; // Support both User (number) and Counselor (string UUID)
  tutorId?: number; // For tutor authentication
  email: string;
  username: string;
  role?: string
}

export function generateToken(
  payload: Payload,
  expiresIn: SignOptions["expiresIn"] = "1h"
): string {
  const secret = process.env.JWT_SECRET_KEY

  if (!secret) {
    throw new Error("JWT_SECRET_KEY environment variable is not set")
  }

  return jwt.sign(payload, secret, { expiresIn })
}
