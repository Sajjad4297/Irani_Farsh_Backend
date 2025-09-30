// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { verifyUserToken } from "../utilities/token.js";
// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: { id: number; email: string } | JwtPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyUserToken(token);
    if(!decoded){
        throw new Error("Invalid");
    }
    req.user = decoded; // attach decoded payload to request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
