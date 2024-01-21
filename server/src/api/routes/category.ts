import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import middlewares from '../middlewares';
import { IArticleInput } from '../../interfaces/IArticle';
import { MulterFile } from '../../interfaces/IMulter';
import CategoryService from '../../services/category';
import { ICategoryInput } from '../../interfaces/ICategory';
const route = Router();

export default (app: Router): void => {
  app.use('/category', route);

  route.post(
    '/create',
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    middlewares.isAdmin,
    async (
      req: Request & { file: MulterFile },
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const categoryServiceInstance = Container.get(CategoryService);
        const article = await categoryServiceInstance.Create(
          req.body as ICategoryInput,
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
        const categoryServiceInstance = Container.get(CategoryService);
        const categories = await categoryServiceInstance.GetAllCategories();
        return res.status(200).json({ success: true, data: categories });
      } catch (e) {
        return next(e);
      }
    },
  );
};
