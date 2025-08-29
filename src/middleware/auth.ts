import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import User, { IUser } from '../models/User';
import { authOptions } from '../pages/api/auth/[...nextauth]';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends NextApiRequest {
  user?: IUser;
}

export async function auth(req: AuthRequest, res: NextApiResponse, next: () => void) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

export async function isAdmin(req: AuthRequest, res: NextApiResponse, next: () => void) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized as admin' });
  }
  next();
}
