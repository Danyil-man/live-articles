import { Types, PopulatedDoc } from 'mongoose';
import { IUser } from './IUser';
import { IComment } from './IComments';

export interface IArticle {
  _id: string | Types.ObjectId;
  image: string;
  title: string;
  description: string;
  likes?: PopulatedDoc<IUser, Types.ObjectId>[];
  author: PopulatedDoc<IUser, Types.ObjectId>;
  comments?: PopulatedDoc<IComment, Types.ObjectId>[];
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt?: Date;
}

export interface IArticleInput {
  image: string;
  title: string;
  description: string;
}

export interface IPostData {
  total: number;
  result: IArticle[];
}
