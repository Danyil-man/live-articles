import { Container } from 'typedi';
import { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../../interfaces/IUser';

const attachCurrentUser: RequestHandler = async (req, res, next) => {
  try {
    const UserModel = Container.get('userModel') as mongoose.Model<
      IUser & mongoose.Document
    >;
    const userRecord = await UserModel.findById((req.token as JwtPayload).id);
    if (!userRecord) {
      return res.sendStatus(401);
    }
    const currentUser = userRecord.toObject();
    req.currentUser = currentUser;

    return next();
  } catch (e) {
    return next(e);
  }
};

export default attachCurrentUser;
