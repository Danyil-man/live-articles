import { IArticle } from '../interfaces/IArticle';
import mongoose from 'mongoose';

const Article = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Please add image'],
    },

    title: String,

    description: String,

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },

  { timestamps: true, versionKey: false },
);

export default mongoose.model<IArticle & mongoose.Document>('Article', Article);
