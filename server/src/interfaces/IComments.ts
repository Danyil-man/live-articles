import { Types, PopulatedDoc } from 'mongoose';
import { IUser } from './IUser';
import { IArticle } from './IArticle';

export interface IComment {
  _id: string | Types.ObjectId;
  text: string;
  author?: PopulatedDoc<IUser, Types.ObjectId>;
  article: PopulatedDoc<IArticle, Types.ObjectId>;
  parent: PopulatedDoc<IComment, Types.ObjectId>;
  mainParent: PopulatedDoc<IComment, Types.ObjectId>;
  replies: PopulatedDoc<IComment, Types.ObjectId>[];
  likes?: PopulatedDoc<IUser, Types.ObjectId>[];
  isAuthor?: boolean;
  createdAt?: Date;
}

export interface ICommentInput {
  text: string;
}

export interface ICommentData {
  total: number;
  result: IComment[];
}

export interface ICommentResponse {
  comment: string;
}
