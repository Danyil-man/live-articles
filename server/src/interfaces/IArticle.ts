import { Types, PopulatedDoc } from 'mongoose';
import { IUser } from './IUser';
import { IComment } from './IComments';
import { MulterFile } from './IMulter';
import { ICategory } from './ICategory';

export interface IArticle {
  _id: string | Types.ObjectId;
  image: {
    public_id: string;
    created_at: string;
    url: string;
    secure_url: string;
  };
  title: string;
  description: string;
  likes?: PopulatedDoc<IUser, Types.ObjectId>[];
  author: PopulatedDoc<IUser, Types.ObjectId>;
  category: PopulatedDoc<ICategory, Types.ObjectId>;
  comments?: PopulatedDoc<IComment, Types.ObjectId>[];
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt?: Date;
}

export interface IArticleInput {
  file: MulterFile;
  title: string;
  description: string;
  category: string;
}

export interface IArticleData {
  total: number;
  result: IArticle[];
}

export interface IArticleParams {
  myArticles?: string;
  favouriteArticles?: string;
  user_id?: string;
}
