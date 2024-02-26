import { Router } from 'express';
import auth from './routes/auth';
import articles from './routes/articles';
import category from './routes/category';
import comment from './routes/comment';

export default (): Router => {
  const app = Router();
  auth(app);
  articles(app);
  category(app);
  comment(app);

  return app;
};
