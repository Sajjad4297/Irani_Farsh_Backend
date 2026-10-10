import 'dotenv/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required but not set. Refusing to start.',
  );
}

export function generateUserToken(
  userId: number | string,
  phone?: string,
  email?: string,
): string {
  return jwt.sign(
    { id: userId, phone, email, role: 'user' }, // user-specific payload
    JWT_SECRET,
    { expiresIn: '30d' }, // token expires in 30 days
  );
}

export function verifyUserToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      phone?: string;
      email?: string;
      role?: string;
      admin?: string;
    };
    if (!decoded || typeof decoded !== 'object') return null;
    // Reject admin tokens and anything without a user id.
    if (decoded.role === 'admin' || decoded.admin !== undefined) return null;
    if (decoded.role !== undefined && decoded.role !== 'user') return null;
    if (decoded.id === undefined || decoded.id === null) return null;
    return decoded; // contains user-specific data
  } catch (err) {
    return null;
  }
}

export function generateAdminToken(admin: string): string {
  return jwt.sign(
    { admin, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1d' }, // token expires in 1 day
  );
}

/** Returns the admin username, or null if the token is not a valid admin token. */
export function verifyAdminToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      admin?: string;
      role?: string;
    };
    if (
      !decoded ||
      typeof decoded !== 'object' ||
      decoded.role !== 'admin' ||
      typeof decoded.admin !== 'string'
    ) {
      return null;
    }
    return decoded.admin;
  } catch (err) {
    return null;
  }
}
