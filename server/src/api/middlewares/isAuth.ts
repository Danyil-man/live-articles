import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import ErrorResponse from '../../utils/errorResponse';

const getTokenFromHeader: RequestHandler = async (req, res, next) => {
  try {
    if (
      (req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Token') ||
      (req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer')
    ) {
      const token = req.headers.authorization.split(' ')[1];
      req.token = jwt.verify(token, config.jwtSecret);
      next();
    } else {
      throw new ErrorResponse('User not authenticated', 401);
    }
  } catch (e) {
    return next(e);
  }
};

export default getTokenFromHeader;
