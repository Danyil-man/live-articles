import { Types, PopulatedDoc } from 'mongoose';
import { IArticle } from './IArticle';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum AuthType {
  SIGNIN = 'SIGNIN',
  SIGNUP = 'SIGNUP',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Status {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
}

export interface IUser {
  _id: string | Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role?: Role;
  gender?: Gender;
  avatar?: string;
  age?: number;
  favouriteArticles: PopulatedDoc<IArticle, Types.ObjectId>[];
  myArticles: PopulatedDoc<IArticle, Types.ObjectId>[];
  status: Status;
  createdAt?: Date;
}

export interface IUserInputDTO {
  name: string;
  email: string;
  password?: string;
  status?: Status;
}

export interface IUserInputUpdate {
  name?: string;
  email?: string;
  gender?: Gender;
  age?: number;
}

export interface IUserData {
  total: number;
  result: IUser[] | Promise<IUser>[];
}

export interface IUserParams {
  userId?: string;
}
