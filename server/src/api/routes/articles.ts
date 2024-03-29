import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { celebrate, Joi } from 'celebrate';
import middlewares from '../middlewares';
import { IArticleInput } from '../../interfaces/IArticle';
import { ICommentInput } from '../../interfaces/IComments';
import ArticleService from '../../services/article';
import { IUser } from '../../interfaces/IUser';
import { MulterFile } from '../../interfaces/IMulter';
import multer from 'multer';
const route = Router();

const uploader = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 500000 },
});

export default (app: Router): void => {
  app.use('/articles', route);

  route.post(
    '/create',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    uploader.single('file'),
    async (
      req: Request & { file: MulterFile },
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const article = await articleServiceInstance.Create(
          req,
          req.body as IArticleInput,
          req.currentUser,
        );
        return res.status(200).json({ success: true, data: article });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.get(
    '/',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const articles = await articleServiceInstance.GetAllArticles(
          req.query as any,
        );
        return res.status(200).json({ success: true, data: articles });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.get(
    '/user-articles',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const articles = await articleServiceInstance.GetUserArticles(
          req.query as any,
          req.currentUser,
        );
        return res.status(200).json({ success: true, data: articles });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.get(
    '/popular',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const article = await articleServiceInstance.GetTheMostPopularArticle();
        return res.status(200).json({ success: true, data: article });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.get(
    '/:id',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const article = await articleServiceInstance.GetArticleById(
          req.params.id as string,
        );
        return res.status(200).json({ success: true, data: article });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/:id/favorite',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        const article = await articleServiceInstance.FavouriteArticle(
          req.params.id as string,
          req.currentUser,
          req.body.toFavorite,
        );
        return res.status(200).json({ success: true, data: article });
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
        const article = await articleServiceInstance.LikeArticle(
          req.params.id as string,
          req.currentUser,
          req.body.toLike,
        );
        return res.status(200).json({ success: true, data: article });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/:id/remove',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        await articleServiceInstance.RemoveArticle(
          req.params.id as string,
          req.currentUser,
        );
        return res.status(200).json({ success: true });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/:id/comment',
    celebrate({
      body: Joi.object({
        text: Joi.string().required(),
      }),
    }),
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const articleServiceInstance = Container.get(ArticleService);
        await articleServiceInstance.Comment(
          req.body as ICommentInput,
          req.params.id as string,
          req.currentUser,
        );
        return res.status(200).json({ success: true });
      } catch (e) {
        return next(e);
      }
    },
  );
};
