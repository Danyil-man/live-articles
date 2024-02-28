import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import middlewares from '../middlewares';
import UserService from '../../services/user';
import { ICommentInput } from '../../interfaces/IComments';
import { IUserInputUpdate } from '../../interfaces/IUser';
const route = Router();

export default (app: Router): void => {
  app.use('/user', route);

  route.get(
    '/me',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      return res.status(200).json({ success: true, data: req.currentUser });
    },
  );

  route.get(
    '/profile/:id',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userServiceInstance = Container.get(UserService);
        const user = await userServiceInstance.GetUserById(
          req.currentUser,
          req.params.id,
        );
        return res.status(200).json({ success: true, data: user });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/update',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userServiceInstance = Container.get(UserService);
        const user = await userServiceInstance.UpdateUserData(
          req.currentUser,
          req.body as IUserInputUpdate,
        );
        return res.status(200).json({ success: true, data: user });
      } catch (e) {
        return next(e);
      }
    },
  );
};
