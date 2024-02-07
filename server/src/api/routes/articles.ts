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

  //   route.post(
  //     '/:id/comment',
  //     celebrate({
  //       body: Joi.object({
  //         text: Joi.string().required(),
  //       }),
  //     }),
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     middlewares.isNotDemoUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const comment = await postServiceInstance.Comment(
  //           req.body as ICommentInput,
  //           req.params.id as string,
  //           req.currentUser,
  //         );
  //         return res.status(200).json({ success: true, data: comment });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.get(
  //     '/:id/comment',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const comments = await postServiceInstance.GetAllComments(
  //           req.params.id as string,
  //           req.query as any,
  //           req.currentUser,
  //           1,
  //         );
  //         return res.status(200).json({ success: true, data: comments });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.get(
  //     '/:id/likes',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const users = await postServiceInstance.LikeUsers(
  //           req.query as any,
  //           req.params.id as string,
  //           1,
  //           req.currentUser,
  //         );
  //         return res.status(200).json({ success: true, data: users });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/:id/dislike',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     middlewares.isNotDemoUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const post = await postServiceInstance.Dislike(
  //           req.params.id as string,
  //           req.currentUser,
  //         );
  //         return res.status(200).json({ success: true, data: post });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.get(
  //     '/popular',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const posts = await postServiceInstance.GetMostPopular(
  //           req.currentUser as IUser,
  //         );
  //         return res.status(200).json({ success: true, data: posts });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.get(
  //     '/popular/recent',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const posts = await postServiceInstance.GetMostPopularRecent(
  //           req.currentUser as IUser,
  //         );
  //         return res.status(200).json({ success: true, data: posts });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.get(
  //     '/average',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const postServiceInstance = Container.get(PostService);
  //         const posts = await postServiceInstance.GetAverage(
  //           req.currentUser as IUser,
  //         );
  //         return res.status(200).json({ success: true, data: posts });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );
};
