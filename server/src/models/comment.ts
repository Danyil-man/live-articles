import { IComment } from '../interfaces/IComments';
import mongoose from 'mongoose';

const Comment = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please add comment text'],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },

    mainParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },

    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IComment & mongoose.Document>('Comment', Comment);
