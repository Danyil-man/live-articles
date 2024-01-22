import { IArticle } from '../interfaces/IArticle';
import mongoose from 'mongoose';

const Article = new mongoose.Schema(
  {
    image: {
      public_id: String,
      created_at: String,
      url: String,
      secure_url: String,
    },

    title: String,

    description: String,

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
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
