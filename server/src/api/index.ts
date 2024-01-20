import { Router } from 'express';
import auth from './routes/auth';
import articles from './routes/articles';

export default (): Router => {
  const app = Router();
  auth(app);
  articles(app);

  return app;
};
