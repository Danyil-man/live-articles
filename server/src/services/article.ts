import { Service, Inject, Container } from 'typedi';
import { Document, ObjectId, PopulatedDoc, Types } from 'mongoose';
import {
  IArticle,
  IArticleData,
  IArticleInput,
  IArticleParams,
} from '../interfaces/IArticle';
import {
  IComment,
  ICommentData,
  ICommentInput,
  ICommentResponse,
} from '../interfaces/IComments';
import { IUser, IUserData, Role } from '../interfaces/IUser';
import ErrorResponse from '../utils/errorResponse';
import { IPagination } from '../interfaces/IPagination';
//import UserService from './user';
import axios from 'axios';
import cloudinary from '../storage/cloudinary';
import config from '../config';
import moment from 'moment';
import { Request, Response } from 'express';
import { MulterFile } from '../interfaces/IMulter';
import multer from 'multer';
import { ICategory } from '../interfaces/ICategory';

@Service()
export default class PostService {
  constructor(
    @Inject('articleModel') private articleModel: Models.ArticleModel,
    @Inject('categoryModel') private categoryModel: Models.CategoryModel,
    @Inject('commentModel') private commentModel: Models.CommentModel,
    @Inject('userModel') private userModel: Models.UserModel,
  ) {}

  public async Create(
    req: Request & { file: MulterFile },
    articleInput: IArticleInput,
    user: IUser,
  ): Promise<IArticle> {
    let uploadedImage;

    if (!articleInput.title) {
      throw new ErrorResponse('The article does not contain a title');
    }

    if (!articleInput.description) {
      throw new ErrorResponse('Describe you article');
    }

    if (!articleInput.category) {
      throw new ErrorResponse('You must specify a category for your article');
    }

    let category: ICategory;

    try {
      category = await this.categoryModel.findById(articleInput.category);
    } catch (e) {
      throw new ErrorResponse(
        'An error occurred when the server tried to find the category',
      );
    }

    if (!category) {
      throw new ErrorResponse('The category not found');
    }

    try {
      uploadedImage = await this.uploadFile(req.file.path);
    } catch (e) {
      throw new ErrorResponse('An error occurred with uploading image');
    }

    const data = {
      title: articleInput.title,
      description: articleInput.description,
      image: {
        public_id: uploadedImage.public_id,
        created_at: uploadedImage.created_at,
        url: uploadedImage.url,
        secure_url: uploadedImage.secure_url,
      },
      author: user._id,
      category: category._id,
    };

    let article: IArticle & Document;
    try {
      article = await this.articleModel.create(data);
      article = article.toObject();
    } catch (e) {
      throw new ErrorResponse('The error occurred with creating article');
    }

    return {
      ...article,
      isAuthor: true,
      isLiked: false,
    };
  }

  public async GetArticleById(articleId: string): Promise<IArticle> {
    const article = await this.articleModel
      .findById(articleId)
      .populate('author', {
        name: 1,
        email: 1,
        role: 1,
      })
      .populate('category', {
        name: 1,
      })
      .populate({
        path: 'comments',
        options: {
          sort: { createdAt: -1 },
        },
        populate: [
          {
            path: 'author',
            select: 'name email role avatar',
          },
          {
            path: 'replies',
            options: {
              sort: { createdAt: -1 },
            },
            populate: [
              {
                path: 'author',
                select: 'name email role avatar',
              },
            ],
          },
        ],
      })
      .lean();

    return article;
  }

  public async GetAllArticles(params: IPagination): Promise<IArticleData> {
    const limit = params.limit ? +params.limit : 0;
    const offset = params.offset ? +params.offset : 0;

    const query: any = {};

    if (params.category) {
      query.category = params.category;
    }

    if (params.text) {
      query.title = { $regex: params.text, $options: 'i' };
    }

    const data: IArticleData = {
      total: 0,
      result: [],
    };

    const articles = await this.articleModel
      .find(query)
      .populate('author', {
        name: 1,
        email: 1,
        role: 1,
      })
      .populate('category', {
        name: 1,
      })
      .populate({
        path: 'comments',
        options: {
          sort: { createdAt: -1 },
        },
        populate: [
          {
            path: 'author',
            select: 'name email role avatar',
          },
          {
            path: 'replies',
            options: {
              sort: { createdAt: -1 },
            },
            populate: [
              {
                path: 'author',
                select: 'name email role avatar',
              },
            ],
          },
        ],
      })
      .sort(+params.sort === 1 ? { createdAt: -1 } : { createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean();
    data.result = articles;
    data.total = await this.articleModel.countDocuments(query);
    return data;
  }

  public async RemoveArticle(articleId: string, user: IUser): Promise<void> {
    const article = await this.articleModel.findById(articleId);
    if (!article) {
      throw new ErrorResponse('Article not found');
    }

    if (article.author.toString() !== user._id.toString()) {
      throw new ErrorResponse('You are not author of this article');
    }

    const imageId = article.image.public_id;

    await this.deleteFile(imageId);
    await this.articleModel.findByIdAndDelete(articleId);
  }

  public async GetUserArticles(
    params: IPagination & IArticleParams,
    user: IUser,
  ): Promise<IArticleData> {
    const limit = params.limit ? +params.limit : 0;
    const offset = params.offset ? +params.offset : 0;

    const query: any = {};

    if (+params.favouriteArticles) {
      query._id = { $in: user.favouriteArticles };
    }
    if (+params.myArticles) {
      query.author = new Types.ObjectId(user._id);
    }
    if (params.user_id) {
      query.author = new Types.ObjectId(params.user_id);
    }

    const data: IArticleData = {
      total: 0,
      result: [],
    };

    const articles = await this.articleModel
      .find(query)
      .populate('author', {
        name: 1,
        email: 1,
        role: 1,
      })
      .populate('category', {
        name: 1,
      })
      .populate({
        path: 'comments',
        options: {
          sort: { createdAt: -1 },
        },
        populate: [
          {
            path: 'author',
            select: 'name email role avatar',
          },
          {
            path: 'replies',
            options: {
              sort: { createdAt: -1 },
            },
            populate: [
              {
                path: 'author',
                select: 'name email role avatar',
              },
            ],
          },
        ],
      })
      .skip(offset)
      .limit(limit)
      .lean();

    data.total = await this.articleModel.countDocuments(query);
    data.result = articles;
    return data;
  }

  public async FavouriteArticle(
    currentArticleId: string,
    user: IUser,
    toFavorite: boolean,
  ): Promise<any> {
    const article = await this.articleModel.findById(currentArticleId).lean();
    if (!article) {
      throw new ErrorResponse('Article not found', 404);
    }

    const isSaved = user.favouriteArticles.some(
      (articleId) => articleId.toString() === article._id.toString(),
    );

    if (toFavorite && !isSaved) {
      await this.userModel
        .findByIdAndUpdate(
          user._id,
          {
            $addToSet: {
              favouriteArticles: new Types.ObjectId(currentArticleId),
            },
          },
          { new: true },
        )
        .lean();
    }
    if (isSaved && !toFavorite) {
      await this.userModel
        .findByIdAndUpdate(
          user._id,
          {
            $pull: { favouriteArticles: new Types.ObjectId(currentArticleId) },
          },
          { new: true },
        )
        .lean();
    }
  }

  public async LikeArticle(
    currentArticleId: string,
    user: IUser,
    toLike: boolean,
  ): Promise<any> {
    let article = await this.articleModel.findById(currentArticleId).lean();

    if (!article) {
      throw new ErrorResponse('Article not found', 404);
    }

    const isLiked = article.likes.some(
      (userId) => userId.toString() === user._id.toString(),
    );

    if (toLike && !isLiked) {
      article = await this.articleModel
        .findByIdAndUpdate(
          currentArticleId,
          {
            $addToSet: { likes: user._id },
          },
          { new: true },
        )
        .lean();
    }
    if (isLiked && !toLike) {
      article = await this.articleModel
        .findByIdAndUpdate(
          currentArticleId,
          {
            $pull: { likes: user._id },
          },
          { new: true },
        )
        .lean();
    }
  }

  public async Comment(
    commentInput: ICommentInput,
    articleId: string,
    user: IUser,
  ): Promise<IComment> {
    const article = await this.articleModel
      .findById(articleId)
      .select('author');

    if (!article) {
      throw new ErrorResponse('Article not found', 404);
    }

    let comment = await this.commentModel.create({
      article: article._id,
      author: user._id,
      text: commentInput.text,
    });

    comment = await comment.populate('author');

    await this.articleModel.findByIdAndUpdate(articleId, {
      $push: { comments: comment._id },
    });

    return comment;
  }

  // public async CommentReply(
  //   commentInput: ICommentInput,
  //   commentId: string,
  //   user: IUser,
  // ): Promise<IComment | any> {
  //   let parentComment = await this.commentModel.findById(commentId);
  //   if (!parentComment) {
  //     throw new ErrorResponse(
  //       i18next.t('comment_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }

  //   const post = await this.postModel.findById(parentComment.post);
  //   const isPostAuthor = post.author.toString() === user._id.toString();
  //   const isAuthor = parentComment.author.toString() === user._id.toString();
  //   const { mentions, users } = await this.getMentions(commentInput.text);
  //   const hashtags = this.getHashtags(
  //     commentInput.text,
  //     parentComment.post.toString(),
  //   );
  //   const mainParent = parentComment.mainParent || commentId;
  //   let comment = await this.commentModel.create({
  //     ...commentInput,
  //     mainParent,
  //     parent: commentId,
  //     post: parentComment.post,
  //     author: user._id,
  //     mentions,
  //     hashtags,
  //   });
  //   comment = await comment.populate('author');
  //   parentComment = await this.commentModel.findByIdAndUpdate(mainParent, {
  //     $push: { replies: comment._id },
  //   });
  //   const userId = parentComment.author.toString();
  //   const notificationServiceInstance = Container.get(NotificationService);
  //   await this.postModel.findByIdAndUpdate(parentComment.post, {
  //     $addToSet: { mentions, hashtags },
  //   });
  //   if (!isPostAuthor) {
  //     this.updateRank(config.weight.comment, parentComment.post.toString());
  //   }
  //   if (!isAuthor) {
  //     const userAuthor = await this.userModel
  //       .findOne({
  //         _id: userId,
  //       })
  //       .select('language');
  //     notificationServiceInstance.SendPush({
  //       user: userId,
  //       content: i18next.t('comment_replied', {
  //         username: user.username,
  //         comment: commentInput.text,
  //         lng: userAuthor?.language,
  //       }),
  //       type: NotificationType.replyNotifications,
  //       sender: user._id.toString(),
  //       post: parentComment.post.toString(),
  //       data: {
  //         postId: parentComment.post.toString(),
  //         commentId: comment._id.toString(),
  //       },
  //     });
  //   }
  //   if (users.length) {
  //     users.forEach((mention) => {
  //       if (mention._id.toString() !== userId) {
  //         notificationServiceInstance.SendPush({
  //           user: mention._id.toString(),
  //           content: i18next.t('comment_mentioned', {
  //             username: user.username,
  //             comment: commentInput.text,
  //             lng: mention?.language,
  //           }),
  //           type: NotificationType.mentionNotifications,
  //           sender: user._id.toString(),
  //           post: parentComment.post.toString(),
  //           data: {
  //             postId: parentComment.post.toString(),
  //             commentId: comment._id.toString(),
  //           },
  //         });
  //       }
  //     });
  //   }

  //   const botAuthorOfParentComment = await this.userModel.findOne({
  //     _id: parentComment.author,
  //     isUserBot: true,
  //   });
  //   if (botAuthorOfParentComment) {
  //     let time: number;

  //     await this.userModel.updateOne(
  //       {
  //         _id: botAuthorOfParentComment._id,
  //       },
  //       { $inc: { successCommentDialogs: 1 } },
  //     );

  //     const postDescription = await this.commentModel.findOne({
  //       _id: post.authorComment,
  //     });

  //     const parentText = await this.commentModel.findOne({ _id: commentId });

  //     if (
  //       process.env.NODE_ENV === 'development' ||
  //       process.env.NODE_ENV === 'local'
  //     ) {
  //       time = Math.floor(Math.random() * (5 - 2 + 1)) + 2;
  //     } else {
  //       time = Math.floor(Math.random() * (45 - 15 + 1)) + 15;
  //     }

  //     await this.agendaInstance.schedule(
  //       `in ${time} minutes`,
  //       'createCommentReply',
  //       {
  //         parentCommentType: parentComment.type,
  //         parentCommentText: parentText.text,
  //         postDescription: postDescription.text,
  //         commentText: commentInput.text,
  //         commentId: comment._id,
  //         botAuthorOfParentComment,
  //       },
  //     );
  //   }
  //   return comment;
  // }

  // public async CommentLikeV3(
  //   currentCommentId: string,
  //   user: IUser,
  //   isLiked: boolean,
  // ): Promise<any> {
  //   let comment = await this.commentModel
  //     .findById(currentCommentId)
  //     .populate('author', 'username avatar')
  //     .lean();
  //   if (!comment) {
  //     throw new ErrorResponse(
  //       i18next.t('comment_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   const isCommentLiked =
  //     comment.likes &&
  //     comment.likes.some((userId) => userId.toString() === user._id.toString());
  //   const authorId = comment.author._id.toString();
  //   const isAuthor = authorId === user._id.toString();
  //   if (isLiked && !isCommentLiked) {
  //     comment = await this.commentModel
  //       .findByIdAndUpdate(
  //         currentCommentId,
  //         { $addToSet: { likes: user._id } },
  //         { new: true },
  //       )
  //       .lean();
  //     if (!isAuthor) {
  //       const userAuthor = await this.userModel
  //         .findOne({
  //           _id: authorId,
  //         })
  //         .select('language');
  //       const notificationServiceInstance = Container.get(NotificationService);
  //       notificationServiceInstance.SendPush({
  //         user: authorId,
  //         content: i18next.t('comment_liked', {
  //           username: user.username,
  //           lng: userAuthor?.language,
  //         }),
  //         type: NotificationType.commentLikesNotifications,
  //         sender: user._id.toString(),
  //         post: comment.post.toString(),
  //         data: {
  //           postId: comment.post.toString(),
  //           commentId: comment._id.toString(),
  //         },
  //       });
  //     }
  //   }
  //   if (!isLiked && isCommentLiked) {
  //     comment = await this.commentModel
  //       .findByIdAndUpdate(
  //         currentCommentId,
  //         { $pull: { likes: user._id } },
  //         { new: true },
  //       )
  //       .lean();
  //   }
  // }

  // public async GetMostPopular(user?: IUser): Promise<string[]> {
  //   const userServiceInstance = Container.get(UserService);
  //   const notActiveIds = await userServiceInstance.GetNotActiveIds(user);
  //   const posts = await this.postModel.aggregate([
  //     { $match: { author: { $nin: notActiveIds } } },
  //     { $unwind: '$likes' },
  //     {
  //       $group: {
  //         _id: '$_id',
  //         image: { $first: '$image' },
  //         likes: { $push: '$likes' },
  //         size: { $sum: 1 },
  //       },
  //     },
  //     { $sort: { size: -1 } },
  //   ]);
  //   return posts.map((post) => post._id);
  // }

  // public async GetAllComments(
  //   postId: string,
  //   params: IPaginationParams,
  //   user: IUser,
  //   version: number,
  // ): Promise<ICommentData> {
  //   const limit = params.limit ? +params.limit : 0;
  //   const offset = params.offset ? +params.offset : 0;
  //   const query: any = {
  //     parent: { $exists: false },
  //     post: postId,
  //   };
  //   const data: ICommentData = {
  //     total: 0,
  //     result: [],
  //   };
  //   data.total = await this.commentModel.countDocuments(query);
  //   if (params.lastCommentId) {
  //     query._id =
  //       version !== 1
  //         ? { $gt: params.lastCommentId }
  //         : { $lt: params.lastCommentId };
  //     query.isAuthor = false;
  //   }
  //   const comments = await this.commentModel
  //     .find(query)
  //     .populate([
  //       {
  //         path: 'author',
  //       },
  //       {
  //         path: 'replies',
  //         options: {
  //           sort: { createdAt: version !== 1 ? 1 : -1 },
  //         },
  //         populate: [
  //           {
  //             path: 'author',
  //           },
  //         ],
  //       },
  //     ])
  //     .skip(offset)
  //     .limit(limit)
  //     .sort({ isAuthor: -1, createdAt: version !== 1 ? 1 : -1 })
  //     .lean();
  //   data.result = comments
  //     .filter(
  //       (comment: IComment) =>
  //         !user.blockedUsers
  //           .map((user) => user.toString())
  //           .includes(comment.author._id.toString()) &&
  //         (comment.author as IUser).status === 'ACTIVE',
  //     )
  //     .map((comment) => this.extendComment(comment, user, 2, version));

  //   return data;
  // }

  // public async GetCommentReplies(
  //   commentId: string,
  //   params: IPaginationParams,
  //   user: IUser,
  //   version: number,
  // ): Promise<ICommentData> {
  //   const limit = params.limit ? +params.limit : 0;
  //   const offset = params.offset ? +params.offset : 0;
  //   const userServiceInstance = Container.get(UserService);
  //   const notActiveIds = await userServiceInstance.GetNotActiveIds(user);
  //   const data: ICommentData = {
  //     total: 0,
  //     result: [],
  //   };
  //   const query: any = {
  //     mainParent: commentId,
  //     author: { $nin: notActiveIds },
  //   };
  //   data.total = await this.commentModel.countDocuments(query);
  //   if (params.lastCommentId) {
  //     query._id =
  //       version !== 1
  //         ? { $gt: params.lastCommentId }
  //         : { $lt: params.lastCommentId };
  //   }
  //   const comments = await this.commentModel
  //     .find(query)
  //     .populate([
  //       {
  //         path: 'author',
  //       },
  //       {
  //         path: 'replies',
  //         match: { author: { $nin: notActiveIds } },
  //         options: {
  //           sort: { createdAt: version !== 1 ? 1 : -1 },
  //         },
  //         populate: [
  //           {
  //             path: 'author',
  //           },
  //         ],
  //       },
  //     ])
  //     .skip(offset)
  //     .limit(limit)
  //     .sort(version !== 1 ? 'createdAt' : '-createdAt')
  //     .lean();
  //   if (version === 3) {
  //     data.result = comments.map((comment) => {
  //       const optimizedComment = this.extendComment(
  //         comment,
  //         user,
  //         null,
  //         version,
  //       );
  //       return optimizedComment;
  //     });
  //   } else {
  //     data.result = comments.map((comment) =>
  //       this.extendComment(comment, user),
  //     );
  //   }

  //   return data;
  // }

  // public async CommentRemove(commentId: string, user: IUser): Promise<void> {
  //   const comment = await this.commentModel.findById(commentId);
  //   if (!comment) {
  //     throw new ErrorResponse(
  //       i18next.t('comment_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   if (comment.author.toString() !== user._id.toString()) {
  //     throw new ErrorResponse(
  //       i18next.t('not_comment_author', { lng: user?.language }),
  //       400,
  //     );
  //   }
  //   await this.commentModel.findOneAndDelete({ _id: commentId });
  //   this.updateRank(-config.weight.comment, comment.post.toString());
  // }

  public multerGetFile(
    req: Request & { file: MulterFile },
    res: Response,
  ): Promise<Express.Multer.File & MulterFile> {
    return new Promise((resolve, reject) => {
      multer().single('file')(req, res, function (error: any) {
        if (error) {
          reject(error);
        }
        if (!req.file) {
          reject(new Error('No files provided'));
        }
        resolve(req.file);
      });
    });
  }

  public async uploadFile(filePath: any) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'live-articles',
      });
      return result;
    } catch (e) {
      throw new ErrorResponse('The error occurred with uploading photo');
    }
  }

  public async deleteFile(imageId: string) {
    try {
      await cloudinary.uploader.destroy(imageId);
    } catch (e) {
      throw new ErrorResponse('The error occurred with deleting photo');
    }
  }
}
