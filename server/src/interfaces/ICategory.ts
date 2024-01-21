import { Types } from 'mongoose';

export interface ICategory {
  _id: string | Types.ObjectId;
  name: string;
  createdAt?: Date;
}

export interface ICategoryInput {
  name: string;
}
