import Container from 'typedi';
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

Comment.post('findOneAndDelete', async function (doc) {
  const Article = mongoose.model('Article');
  await Article.updateMany(
    { comments: { $in: [doc._id] } },
    { $pull: { comments: { $in: [doc._id] } } },
  );
  const Comment = mongoose.model('Comment');
  await Comment.updateMany(
    { replies: { $in: [doc._id] } },
    { $pull: { replies: { $in: [doc._id] } } },
  );
  if (doc.replies && doc.replies.length) {
    await Comment.deleteMany({ _id: { $in: doc.replies } });
  }
});

export default mongoose.model<IComment & mongoose.Document>('Comment', Comment);
