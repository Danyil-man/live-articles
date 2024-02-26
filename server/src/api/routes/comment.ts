import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import middlewares from '../middlewares';
import ArticleService from '../../services/article';
import { ICommentInput } from '../../interfaces/IComments';
const route = Router();

export default (app: Router): void => {
  app.use('/comment', route);

  route.post(
    '/:id/reply',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const comment = await articleServiceInstance.CreateCommentReply(
          req.body as ICommentInput,
          req.params.id as string,
          req.currentUser,
        );
        return res.status(200).json({ success: true, data: comment });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/:id/like',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const comment = await articleServiceInstance.LikeComment(
          req.params.id as string,
          req.currentUser,
          req.body.toLike,
        );
        return res.status(200).json({ success: true, data: comment });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/:id/delete',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const comment = await articleServiceInstance.DeleteComment(
          req.params.id as string,
          req.currentUser,
        );
        return res.status(200).json({ success: true, data: comment });
      } catch (e) {
        return next(e);
      }
    },
  );
};
