import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

export function generateUserToken(userId: string, email: string): string {
  return jwt.sign(
    { id: userId, email },   // user-specific payload
    JWT_SECRET,
    { expiresIn: "1d" }      // token expires in 1 hour
  );
}
export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    return decoded; // contains user-specific data
  } catch (err) {
    return null;
  }
}
