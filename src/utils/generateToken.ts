import jwt, { SignOptions } from "jsonwebtoken"

interface Payload {
  userId?: number | string;
  tutorId?: number;
  email: string;
  username?: string;
  role?: string
}

export function generateToken(
  payload: Payload,
  isRefreshToken: boolean = false
): string {
  
  const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET_KEY : process.env.JWT_SECRET_KEY
  const expiration = isRefreshToken ? process.env.JWT_REFRESH_TOKEN_EXPIRATION : process.env.JWT_ACCESS_TOKEN_EXPIRATION

  if (!secret) {
    throw new Error(
      isRefreshToken
        ? "JWT_REFRESH_SECRET_KEY environment variable is not set"
        : "JWT_SECRET_KEY environment variable is not set"
    )
  }

  if (!expiration) {
    throw new Error(
      isRefreshToken
        ? "JWT_REFRESH_TOKEN_EXPIRATION environment variable is not set"
        : "JWT_ACCESS_TOKEN_EXPIRATION environment variable is not set"
    )
  }

  const options: SignOptions = {
    expiresIn: expiration as SignOptions["expiresIn"],
  }

  return jwt.sign(payload, secret, options)
}
