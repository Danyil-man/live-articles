import { RequestHandler } from 'express';
import { Role } from '../../interfaces/IUser';

const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    if (req.currentUser.role !== Role.ADMIN) {
      return res
        .status(403)
        .json({ error: 'You are not an admin', success: false });
    }
    return next();
  } catch (e) {
    return next(e);
  }
};

export default isAdmin;
