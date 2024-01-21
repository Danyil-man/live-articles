import { Model, Document, LeanDocument } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../../interfaces/IUser';
import { IComment } from '../../interfaces/IComments';
import { IArticle } from '../../interfaces/IArticle';
import { ICategory } from '../../interfaces/ICategory';

declare global {
  interface Error extends Error {
    status?: number;
    field?: string;
  }
  namespace Express {
    export interface Request {
      currentUser: IUser & LeanDocument;
      token: string | JwtPayload;
    }
    export interface Query {
      id: string;
    }
  }

  namespace Models {
    export type UserModel = Model<IUser & Document>;
    export type CommentModel = Model<IComment & Document>;
    export type ArticleModel = Model<IArticle & Document>;
    export type CategoryModel = Model<ICategory & Document>;
  }
}
