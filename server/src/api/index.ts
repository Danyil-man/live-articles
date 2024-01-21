import { Router } from 'express';
import auth from './routes/auth';
import articles from './routes/articles';
import category from './routes/category';

export default (): Router => {
  const app = Router();
  auth(app);
  articles(app);
  category(app);

  return app;
};
