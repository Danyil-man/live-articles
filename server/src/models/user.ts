import { IUser, Role, Gender, Status } from '../interfaces/IUser';
import mongoose from 'mongoose';

const User = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add username'],
      unique: true,
    },

    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },

    password: {
      type: String,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: [...Object.values(Role)],
      default: Role.USER,
    },

    status: {
      type: String,
      enum: [...Object.values(Status)],
      default: Status.PENDING,
    },

    gender: {
      type: String,
      enum: [...Object.values(Gender)],
    },

    avatar: String,

    age: Number,

    favouriteArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],

    myArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model<IUser & mongoose.Document>('User', User);
