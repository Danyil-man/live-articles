import { Model, Document, LeanDocument } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

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
    //export type ChallengeWinnersModel = Model<IChallengeWinners & Document>;
  }
}
