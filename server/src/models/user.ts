import { IUser, Role, Gender } from '../interfaces/IUser';
import jwt from 'jsonwebtoken';
import config from '../config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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

User.pre<IUser & mongoose.Document>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

User.methods.getSignedJwtToken = function (this: IUser & mongoose.Document) {
  return jwt.sign({ id: this._id, role: this.role }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

User.methods.matchPassword = async function (
  this: IUser & mongoose.Document,
  enteredPassword: string,
) {
  if (this.password) {
    return await bcrypt.compare(enteredPassword, this.password);
  } else {
    return true;
  }
};

export default mongoose.model<IUser & mongoose.Document>('User', User);
