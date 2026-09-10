import jwt from 'jsonwebtoken';

export function protectNotification(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
    const user = token && jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');
    if (!user?.id) throw new Error();
    user.role ||= 'expert';
    if (!['seeker', 'expert', 'admin'].includes(user.role)) throw new Error();
    req.user = user;
    next();
  } catch { res.status(401).json({ message: 'Not authorized' }); }
}
