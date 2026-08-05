import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

export const protectSeeker = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.role !== 'seeker') {
        return res.status(403).json({ message: 'Not authorized as seeker' });
      }

      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};
