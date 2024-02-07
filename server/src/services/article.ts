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

    console.log(currentArticleId, toLike);
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

  // public async CreateComment(
  //   commentText: string,
  //   post: IPost,
  //   isGeneratedComment = false,
  //   differentCommentData?: { isDifferentComment: boolean; type: string },
  // ): Promise<void> {
  //   let generatedResponse: ICommentResponse;
  //   if (!isGeneratedComment) {
  //     generatedResponse = await getCommentVariant(
  //       commentText,
  //       differentCommentData,
  //     );
  //   }

  //   const randomBot = await this.userModel.aggregate([
  //     { $match: { isUserBot: true } },
  //     { $sample: { size: 1 } },
  //   ]);

  //   const isAuthor = post.author.toString() === randomBot[0]._id.toString();
  //   let comment = await this.commentModel.create({
  //     text: isGeneratedComment ? commentText : generatedResponse.comment,
  //     post: post._id,
  //     author: randomBot[0]._id,
  //     ...(!isGeneratedComment && { type: generatedResponse.type }),
  //   });
  //   comment = await comment.populate('author');
  //   post = await this.postModel.findByIdAndUpdate(post._id, {
  //     $push: { comments: comment._id },
  //   });
  //   try {
  //     await this.userModel.updateOne(
  //       {
  //         _id: randomBot[0]._id,
  //       },
  //       { $inc: { postsCommented: 1 } },
  //     );
  //   } catch (e) {
  //     throw new Error(`Error occured with updating bot data. Error: ${e}`);
  //   }
  //   const notificationServiceInstance = Container.get(NotificationService);
  //   const userId = post.author.toString();
  //   if (!isAuthor) {
  //     const user = await this.userModel
  //       .findOne({
  //         _id: userId,
  //       })
  //       .select('language');
  //     await this.updateRank(config.weight.comment, post._id.toString());
  //     notificationServiceInstance.SendPush({
  //       user: userId,
  //       content: i18next.t('commented', {
  //         username: randomBot[0].username,
  //         comment: isGeneratedComment ? commentText : generatedResponse.comment,
  //         lng: user?.language,
  //       }),
  //       type: NotificationType.commentsNotifications,
  //       sender: randomBot[0]._id.toString(),
  //       post: post._id.toString(),
  //       data: {
  //         postId: post._id.toString(),
  //         commentId: comment._id.toString(),
  //       },
  //     });
  //   }
  // }

  // public async CreateCommentReply(
  //   parentCommentType: string,
  //   parentCommentText: string,
  //   postDescription: string,
  //   commentText: string,
  //   commentId: string,
  //   botAuthorOfParentComment: IUser,
  // ): Promise<IComment> {
  //   const generatedResponse = await getCommentVariant(postDescription, null, {
  //     parentCommentType: parentCommentType,
  //     parentCommentText: parentCommentText,
  //     userText: commentText,
  //     userComment: commentId,
  //   });

  //   if (typeof generatedResponse.continue == 'boolean') {
  //     if (!generatedResponse.continue) {
  //       return;
  //     }
  //   }
  //   if (typeof generatedResponse.continue == 'string') {
  //     if (generatedResponse.continue == 'False') {
  //       return;
  //     }
  //   }

  //   let parentComment = await this.commentModel.findById(commentId);
  //   if (!parentComment) {
  //     throw new Error('Comment not found');
  //   }

  //   const post = await this.postModel.findById(parentComment.post);
  //   const isPostAuthor =
  //     post.author.toString() === botAuthorOfParentComment._id.toString();
  //   const isAuthor =
  //     parentComment.author.toString() ===
  //     botAuthorOfParentComment._id.toString();
  //   const userId = parentComment.author.toString();
  //   const userComment = await this.userModel.findOne({
  //     _id: parentComment.author,
  //   });

  //   const replyComment = `@${userComment.username} ${generatedResponse.comment}`;
  //   const { mentions, users } = await this.getMentions(replyComment);
  //   const mainParent = parentComment.mainParent || commentId;

  //   let fixedReplyComment = '';
  //   if (replyComment.includes(`@${botAuthorOfParentComment.username}`)) {
  //     fixedReplyComment = replyComment.replace(
  //       `@${botAuthorOfParentComment.username}`,
  //       '',
  //     );
  //     fixedReplyComment.trim();
  //   }
  //   let commentReply = await this.commentModel.create({
  //     text: fixedReplyComment || replyComment,
  //     mainParent,
  //     parent: commentId,
  //     post: parentComment.post,
  //     author: botAuthorOfParentComment._id,
  //     mentions,
  //     ...('type' in generatedResponse && { type: generatedResponse.type }),
  //   });
  //   commentReply = await commentReply.populate('author');
  //   parentComment = await this.commentModel.findByIdAndUpdate(mainParent, {
  //     $push: { replies: commentReply._id },
  //   });
  //   const notificationServiceInstance = Container.get(NotificationService);
  //   await this.postModel.findByIdAndUpdate(parentComment.post, {
  //     $addToSet: { mentions },
  //   });
  //   if (!isPostAuthor) {
  //     await this.updateRank(
  //       config.weight.comment,
  //       parentComment.post.toString(),
  //     );
  //   }
  //   if (!isAuthor) {
  //     const user = await this.userModel
  //       .findOne({
  //         _id: userId,
  //       })
  //       .select('language');
  //     notificationServiceInstance.SendPush({
  //       user: userId,
  //       content: i18next.t('comment_replied', {
  //         username: botAuthorOfParentComment.username,
  //         comment: generatedResponse.comment,
  //         lng: user?.language,
  //       }),
  //       type: NotificationType.replyNotifications,
  //       sender: botAuthorOfParentComment._id.toString(),
  //       post: parentComment.post.toString(),
  //       data: {
  //         postId: parentComment.post.toString(),
  //         commentId: commentReply._id.toString(),
  //       },
  //     });
  //   }
  //   if (users.length) {
  //     users.forEach((mention) => {
  //       if (mention._id.toString() !== userId) {
  //         notificationServiceInstance.SendPush({
  //           user: mention._id.toString(),
  //           content: i18next.t('comment_mentioned', {
  //             username: botAuthorOfParentComment.username,
  //             comment: commentText,
  //             lng: mention?.language,
  //           }),
  //           type: NotificationType.mentionNotifications,
  //           sender: botAuthorOfParentComment._id.toString(),
  //           post: parentComment.post.toString(),
  //           data: {
  //             postId: parentComment.post.toString(),
  //             commentId: commentReply._id.toString(),
  //           },
  //         });
  //       }
  //     });
  //   }
  //   return commentReply;
  // }

  // public async Comment(
  //   commentInput: ICommentInput,
  //   postId: string,
  //   user: IUser,
  // ): Promise<IComment> {
  //   let post = await this.postModel.findById(postId).select('author');
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   const isAuthor = post.author.toString() === user._id.toString();
  //   const { mentions, users } = await this.getMentions(commentInput.text);
  //   const hashtags = this.getHashtags(commentInput.text, postId);
  //   let comment = await this.commentModel.create({
  //     ...commentInput,
  //     post: post._id,
  //     author: user._id,
  //     mentions,
  //     hashtags,
  //   });

  //   comment = await comment.populate('author');
  //   post = await this.postModel.findByIdAndUpdate(postId, {
  //     $push: { comments: comment._id },
  //     $addToSet: { mentions, hashtags },
  //   });

  //   const notificationServiceInstance = Container.get(NotificationService);
  //   const userId = post.author.toString();
  //   if (!isAuthor) {
  //     const postUser = await this.userModel
  //       .findOne({
  //         _id: userId,
  //       })
  //       .select('language');
  //     this.updateRank(config.weight.comment, postId);
  //     notificationServiceInstance.SendPush({
  //       user: userId,
  //       content: i18next.t('commented', {
  //         username: user.username,
  //         comment: commentInput.text,
  //         lng: postUser?.language,
  //       }),
  //       type: NotificationType.commentsNotifications,
  //       sender: user._id.toString(),
  //       post: post._id.toString(),
  //       data: {
  //         postId: post._id.toString(),
  //         commentId: comment._id.toString(),
  //       },
  //     });
  //   }
  //   if (users.length) {
  //     users.forEach((mention) => {
  //       if (
  //         mention._id.toString() !== userId ||
  //         mention._id.toString() !== user._id.toString()
  //       ) {
  //         notificationServiceInstance.SendPush({
  //           user: mention._id.toString(),
  //           content: i18next.t('comment_mentioned', {
  //             username: user.username,
  //             comment: commentInput.text,
  //             lng: mention?.language,
  //           }),
  //           type: NotificationType.mentionNotifications,
  //           sender: user._id.toString(),
  //           post: post._id.toString(),
  //           data: {
  //             postId: post._id.toString(),
  //             commentId: comment._id.toString(),
  //           },
  //         });
  //       }
  //     });
  //   }
  //   return comment;
  // }

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

  // public async EditComment(
  //   commentInput: ICommentInput,
  //   commentId: string,
  //   user: IUser,
  // ): Promise<IComment> {
  //   let comment = await this.commentModel.findById(commentId);
  //   if (!comment) {
  //     throw new ErrorResponse(
  //       i18next.t('comment_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   const isAuthor = comment.author.toString() === user._id.toString();
  //   if (!isAuthor) {
  //     throw new ErrorResponse(
  //       i18next.t('not_comment_author', { lng: user?.language }),
  //       400,
  //     );
  //   }
  //   const { mentions } = await this.getMentions(commentInput.text);
  //   const hashtags = this.getHashtags(
  //     commentInput.text,
  //     comment.post.toString(),
  //     comment.hashtags,
  //   );
  //   comment = await this.commentModel.findByIdAndUpdate(
  //     commentId,
  //     {
  //       ...commentInput,
  //       mentions,
  //       hashtags,
  //     },
  //     { new: true },
  //   );
  //   await this.postModel.findByIdAndUpdate(comment.post, {
  //     $addToSet: { mentions, hashtags },
  //   });
  //   comment = await comment.populate('author');
  //   return comment;
  // }

  // public async LikeUsers(
  //   params: IPaginationParams,
  //   currentPostId: string,
  //   version: number,
  //   currentUser: IUser,
  // ): Promise<IUserData> {
  //   const userServiceInstance = Container.get(UserService);
  //   const limit = params.limit ? +params.limit : 0;
  //   const offset = params.offset ? +params.offset : 0;
  //   const post = await this.postModel.findById(currentPostId).select('likes');
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: currentUser?.language }),
  //       404,
  //     );
  //   }
  //   const query: any = { _id: { $in: post.likes } };
  //   const data: IUserData = {
  //     total: 0,
  //     result: [],
  //   };
  //   const users =
  //     post.likes && post.likes.length
  //       ? await this.userModel.find(query).skip(offset).limit(limit).lean()
  //       : [];
  //   if (version === 3) {
  //     data.result = users.map((user) => {
  //       const optimizedUser = userServiceInstance.optimizeUserData(user, true);
  //       return optimizedUser;
  //     });
  //   } else {
  //     data.result = users;
  //   }
  //   data.total = post.likes ? post.likes.length : 0;
  //   return data;
  // }

  // public async LikeCommentUsers(
  //   params: IPaginationParams,
  //   currentCommentId: string,
  //   version: number,
  //   user: IUser,
  // ): Promise<IUserData> {
  //   const userServiceInstance = Container.get(UserService);
  //   const limit = params.limit ? +params.limit : 0;
  //   const offset = params.offset ? +params.offset : 0;
  //   const comment = await this.commentModel
  //     .findById(currentCommentId)
  //     .select('likes');
  //   if (!comment) {
  //     throw new ErrorResponse(
  //       i18next.t('comment_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   const query: any = { _id: { $in: comment.likes } };
  //   const data: IUserData = {
  //     total: 0,
  //     result: [],
  //   };
  //   const users =
  //     comment.likes && comment.likes.length
  //       ? await this.userModel.find(query).skip(offset).limit(limit).lean()
  //       : [];
  //   if (version === 3) {
  //     data.result = users.map((user) => {
  //       const optimizedUser = userServiceInstance.optimizeUserData(user, true);
  //       return optimizedUser;
  //     });
  //   } else {
  //     data.result = users;
  //   }
  //   data.total = comment.likes ? comment.likes.length : 0;
  //   return data;
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

  // public async GetMostPopularRecent(user?: IUser): Promise<string[]> {
  //   const userServiceInstance = Container.get(UserService);
  //   const notActiveIds = await userServiceInstance.GetNotActiveIds(user);
  //   const posts = await this.postModel.find({
  //     $and: [
  //       { author: { $nin: notActiveIds } },
  //       { $expr: { $gte: [{ $size: '$likes' }, 5] } },
  //       { createdAt: { $gte: moment().subtract(7, 'days').toDate() } },
  //     ],
  //   });
  //   return posts
  //     .sort((a, b) => (a.likes.length > b.likes.length ? -1 : 1))
  //     .map((post) => post._id);
  // }

  // public async GetAllPosts(
  //   params: IPaginationParams,
  //   user: IUser,
  // ): Promise<IPostData> {
  //   const userServiceInstance = Container.get(UserService);
  //   const notActiveIds = await userServiceInstance.GetNotActiveIds(user);
  //   const limit = params.limit ? +params.limit : 0;
  //   const offset = params.offset ? +params.offset : 0;

  //   let isFeatured: number;
  //   if (
  //     params.isFeatured &&
  //     params.isFeatured === 'null' &&
  //     user.role === Role.DEMO
  //   ) {
  //     isFeatured = 1;
  //   } else if (
  //     params.isFeatured &&
  //     params.isFeatured === 'null' &&
  //     user.role !== Role.DEMO
  //   ) {
  //     isFeatured = 0;
  //   } else {
  //     isFeatured = params.isFeatured ? +params.isFeatured : 0;
  //   }

  //   let query: any;
  //   if (isFeatured) {
  //     query = { isFeatured: true };
  //   } else {
  //     const shadowHiddenPost = await this.hiddenPostIds(user);
  //     const sliceAmount = (offset + limit) * 2;
  //     const activePosts = await this.activePostsModel.aggregate([
  //       { $match: { user: user._id } },
  //       { $unwind: '$posts' },
  //       { $sort: { posts: -1 } },
  //       { $group: { _id: '$_id', posts: { $push: '$posts' } } },
  //       { $project: { posts: { $slice: ['$posts', sliceAmount] } } },
  //     ]);
  //     query = {
  //       $or: [{ _id: { $in: activePosts[0]?.posts } }, { rank: { $gte: 100 } }],
  //     };
  //     if (shadowHiddenPost.length) {
  //       query._id = { $nin: shadowHiddenPost };
  //     }
  //     if (notActiveIds.length) {
  //       query.author = { $nin: notActiveIds };
  //     }
  //   }

  //   const data: IPostData = {
  //     total: 0,
  //     result: [],
  //   };
  //   const posts = await this.postModel
  //     .find(query, {
  //       author: 1,
  //       authorComment: 1,
  //       comments: 1,
  //       createdAt: 1,
  //       updatedAt: 1,
  //       image: 1,
  //       thumbImage: 1,
  //       shadowHide: 1,
  //       likes: 1,
  //       dislikes: 1,
  //       generation: 1,
  //       isFeatured: 1,
  //       featuredIndex: 1,
  //     })
  //     .populate('author', {
  //       username: 1,
  //       email: 1,
  //       role: 1,
  //       status: 1,
  //       isUserBot: 1,
  //       createdAt: 1,
  //       updatedAt: 1,
  //       gender: 1,
  //       name: 1,
  //       avatar: 1,
  //       followers: 1,
  //       following: 1,
  //       myPosts: 1,
  //       favouritePosts: 1,
  //       blockedUsers: 1,
  //     })
  //     .populate({
  //       path: 'comments',
  //       options: {
  //         sort: { createdAt: 1 },
  //       },
  //       populate: [
  //         {
  //           path: 'author',
  //           select:
  //             'username name email role status gender avatar isUserBot createdAt updatedAt',
  //         },
  //         {
  //           path: 'replies',
  //           select: 'text isAuthor author createdAt parent likes post mentions',
  //           options: {
  //             sort: { createdAt: 1 },
  //           },
  //           populate: [
  //             {
  //               path: 'author',
  //               select:
  //                 'username name email role status gender avatar isUserBot createdAt updatedAt',
  //             },
  //           ],
  //         },
  //       ],
  //     })
  //     .populate({
  //       path: 'authorComment',
  //     })
  //     .populate({
  //       path: 'challenge',
  //       populate: [
  //         {
  //           path: 'winners',
  //           select: 'position challenge user post',
  //         },
  //       ],
  //     })
  //     .populate({
  //       path: 'generation',
  //       select: 'prompt type',
  //       populate: [
  //         {
  //           path: 'style',
  //           select: 'models',
  //           populate: [{ path: 'models', select: '_id isPremium' }],
  //         },
  //       ],
  //     })
  //     .sort(isFeatured === 1 ? { featuredIndex: 1 } : '-createdAt')
  //     .skip(offset)
  //     .limit(limit)
  //     .lean();
  //   data.result = await Promise.all(
  //     posts.map(async (post) => {
  //       const extendedPost = await this.extendPostV3(post, user);
  //       return extendedPost;
  //     }),
  //   );
  //   data.total = await this.postModel.countDocuments(query);
  //   return data;
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

  // public async AdminRemove(postId: string): Promise<void> {
  //   await this.postModel.findOneAndDelete({ _id: postId });
  // }

  // public async AdminRemoveComment(commentId: string): Promise<void> {
  //   await this.commentModel.findOneAndDelete({ _id: commentId });
  // }

  // private async getMentions(
  //   text: string,
  // ): Promise<{ mentions: string[]; users: IUser[] }> {
  //   const regex = /\B@\w+/g;
  //   const usernamesMentions = text.match(regex);
  //   if (!usernamesMentions) {
  //     return {
  //       users: [],
  //       mentions: [],
  //     };
  //   }
  //   const usernames = usernamesMentions.map((username) =>
  //     username.substring(1),
  //   );
  //   const users = await this.userModel
  //     .find({ username: { $in: usernames } })
  //     .select('_id language');
  //   return {
  //     users,
  //     mentions: usernames,
  //   };
  // }

  // private getHashtags(
  //   text: string,
  //   postId: string,
  //   oldHashtags?: string[],
  // ): string[] {
  //   const regex = /\B#\w+/g;
  //   const hashtags = text.match(regex) || [];
  //   const words = hashtags.map((hashtag: string) => hashtag.substring(1));
  //   let newWords = words;
  //   if (oldHashtags && oldHashtags.length) {
  //     newWords = words.filter(
  //       (word) => !oldHashtags.some((oht) => oht === word),
  //     );
  //   }
  //   newWords.map(async (text) => {
  //     await this.hashtagModel.findOneAndUpdate(
  //       { text },
  //       {
  //         $set: { text },
  //         $addToSet: { posts: postId },
  //         $inc: {
  //           count: 1,
  //         },
  //       },
  //       { upsert: true },
  //     );
  //   });
  //   return words;
  // }

  // public extendComment(
  //   comment: IComment,
  //   currentUser: IUser,
  //   repliesQty?: number,
  //   version = 1,
  // ): IComment {
  //   if (
  //     !(comment.author instanceof Types.ObjectId) &&
  //     !(comment instanceof Types.ObjectId)
  //   ) {
  //     const isFollowed = (comment.author as IUser).followers?.some(
  //       (followerId) => currentUser._id.toString() === followerId.toString(),
  //     );
  //     (comment.author as IUser).isFollowed = isFollowed;
  //     const isLiked =
  //       comment.likes &&
  //       comment.likes.some(
  //         (userId) => userId.toString() === currentUser._id.toString(),
  //       );
  //     comment.isLiked = isLiked;
  //   }
  //   if (comment.replies) {
  //     comment.repliesQty = comment.replies.length;
  //     const replies = repliesQty
  //       ? comment.replies
  //           .filter(
  //             (comment: IComment) =>
  //               !currentUser.blockedUsers
  //                 .map((user) => user.toString())
  //                 .includes(comment.author._id.toString()) &&
  //               (comment.author as IUser).status === 'ACTIVE',
  //           )
  //           .slice(0, repliesQty)
  //       : comment.replies;
  //     comment.replies = replies.map((reply) => {
  //       return this.extendComment(reply as IComment, currentUser, null, 3);
  //     });
  //   }
  //   if (version === 3) {
  //     if (
  //       !(comment.author instanceof Types.ObjectId) &&
  //       !(comment instanceof Types.ObjectId) &&
  //       'myPosts' in (comment.author as IUser) &&
  //       'favouritePosts' in (comment.author as IUser) &&
  //       'following' in (comment.author as IUser) &&
  //       'followers' in (comment.author as IUser) &&
  //       'blockedUsers' in (comment.author as IUser)
  //     ) {
  //       const commentAuthor: IUser = {
  //         ...(comment.author as IUser),
  //         myPostsCount: (comment.author as IUser).myPosts.length,
  //         favouritePostsCount: (comment.author as IUser).favouritePosts.length,
  //         followersCount: (comment.author as IUser).followers.length,
  //         followingCount: (comment.author as IUser).following.length,
  //         blockedUsersCount: (comment.author as IUser).blockedUsers.length,
  //       };

  //       commentAuthor.myPosts && delete commentAuthor.myPosts;
  //       commentAuthor.favouritePosts && delete commentAuthor.favouritePosts;
  //       commentAuthor.followers && delete commentAuthor.followers;
  //       commentAuthor.following && delete commentAuthor.following;
  //       commentAuthor.blockedUsers && delete commentAuthor.blockedUsers;

  //       comment.author = { ...commentAuthor };
  //     }
  //     comment.likesCount = comment.likes ? comment.likes.length : 0;
  //     comment.likes && delete comment.likes;
  //   }
  //   return comment;
  // }

  // public async extendPostV3(
  //   post: IPost,
  //   currentUser?: IUser,
  //   isAllPosts = true,
  //   isCategoriesPosts = false,
  // ): Promise<IPost> {
  //   const userServiceInstance = Container.get(UserService);
  //   let comments: IComment[];
  //   let author = post.author as IUser;
  //   if (
  //     post.comments &&
  //     post.comments.every((comment) => comment instanceof Types.ObjectId)
  //   ) {
  //     comments = post.comments as IComment[];
  //   } else {
  //     comments = post.comments.filter(
  //       (comment: IComment) =>
  //         !currentUser.blockedUsers
  //           .map((user) => user.toString())
  //           .includes(comment.author._id.toString()) &&
  //         (comment.author as IUser).status === 'ACTIVE',
  //     ) as IComment[];
  //   }

  //   if (isAllPosts) {
  //     if (
  //       !((post.authorComment as IComment).author instanceof Types.ObjectId)
  //     ) {
  //       ((post.authorComment as IComment).author as IUser).isFollowed = (
  //         (post.authorComment as IComment).author as IUser
  //       ).followers?.some(
  //         (followerId) => currentUser._id.toString() === followerId.toString(),
  //       );
  //     }
  //     comments = comments
  //       .slice(0, 5)
  //       .map((comment) =>
  //         this.extendComment(comment as IComment, currentUser, 5),
  //       );
  //   }
  //   if (!(author instanceof Types.ObjectId)) {
  //     author = await userServiceInstance.getSpecificUserData(
  //       author,
  //       false,
  //       true,
  //     );
  //   }
  //   if (isAllPosts || isCategoriesPosts) {
  //     if (
  //       !(author instanceof Types.ObjectId) &&
  //       !author.myPostsCount &&
  //       !author.favouritePostsCount &&
  //       !author.followersCount &&
  //       !author.followingCount
  //     ) {
  //       author.isFollowed = (post.author as IUser).followers?.some(
  //         (followerId) => currentUser._id.toString() === followerId.toString(),
  //       );
  //     }
  //   }
  //   let authorComment: IComment;
  //   if (post.authorComment instanceof Types.ObjectId) {
  //     authorComment = post.authorComment as unknown as IComment;
  //   } else {
  //     authorComment = {
  //       ...(post.authorComment as IComment),
  //       likesCount: (post.authorComment as IComment)?.likes
  //         ? (post.authorComment as IComment).likes.length
  //         : 0,
  //       replies: (post.authorComment as IComment)?.replies
  //         ? (post.authorComment as IComment).replies.map((reply: IComment) => {
  //             const replyLikesCount = reply?.likes ? reply.likes.length : 0;
  //             reply.likes && delete reply.likes;
  //             return {
  //               ...reply,
  //               likesCount: replyLikesCount,
  //             };
  //           })
  //         : [],
  //     };
  //     authorComment.likes && delete authorComment.likes;
  //   }

  //   if (
  //     authorComment.author &&
  //     'myPosts' in (authorComment.author as IUser) &&
  //     'favouritePosts' in (authorComment.author as IUser) &&
  //     'following' in (authorComment.author as IUser) &&
  //     'followers' in (authorComment.author as IUser) &&
  //     'blockedUsers' in (authorComment.author as IUser)
  //   ) {
  //     const commentAuthor: IUser = {
  //       ...(authorComment.author as IUser),
  //       myPostsCount: (authorComment.author as IUser).myPosts.length,
  //       favouritePostsCount: (authorComment.author as IUser).favouritePosts
  //         .length,
  //       followersCount: (authorComment.author as IUser).followers.length,
  //       followingCount: (authorComment.author as IUser).following.length,
  //       blockedUsersCount: (authorComment.author as IUser).blockedUsers.length,
  //     };

  //     commentAuthor.myPosts && delete commentAuthor.myPosts;
  //     commentAuthor.favouritePosts && delete commentAuthor.favouritePosts;
  //     commentAuthor.followers && delete commentAuthor.followers;
  //     commentAuthor.following && delete commentAuthor.following;
  //     commentAuthor.blockedUsers && delete commentAuthor.blockedUsers;

  //     authorComment.author = { ...commentAuthor };
  //   }

  //   let extendedPost: IPost = {
  //     ...post,
  //     isAuthor: post.author._id.toString() === currentUser._id.toString(),
  //     author,
  //     comments,
  //     totalComments: comments.length,
  //     authorComment,
  //     isSaved: currentUser.favouritePosts.some(
  //       (item) => post._id.toString() === item.toString(),
  //     ),
  //     isLiked: post.likes.some(
  //       (item) => item.toString() === currentUser._id.toString(),
  //     ),
  //     isDisliked: post.dislikes.some(
  //       (item) => item.toString() === currentUser._id.toString(),
  //     ),
  //     likesCount: post.likes.length,
  //   };

  //   extendedPost.likes && delete extendedPost.likes;
  //   extendedPost.dislikes && delete extendedPost.dislikes;
  //   extendedPost.hashtags && delete extendedPost.hashtags;
  //   extendedPost.mentions && delete extendedPost.mentions;

  //   if (post?.generation) {
  //     extendedPost = {
  //       ...extendedPost,
  //       generation: {
  //         ...(post.generation as IGeneration),
  //         styleId: (post.generation as IGeneration)?.style
  //           ? (post.generation as IGeneration).style._id.toString()
  //           : '',
  //         modelId: (post.generation as IGeneration)?.style
  //           ? (
  //               (post.generation as IGeneration).style as IStyle
  //             ).models[0]._id.toString()
  //           : '64dcac47c6a5a46f9e450177',
  //         isPremium: (post.generation as IGeneration)?.style
  //           ? (
  //               ((post.generation as IGeneration).style as IStyle)
  //                 .models[0] as IModels
  //             ).isPremium
  //           : false,
  //       },
  //     };
  //     (extendedPost.generation as IGeneration)?.style &&
  //       delete (extendedPost.generation as IGeneration)?.style;
  //   }

  //   if (!post?.isFeatured) {
  //     extendedPost = { ...extendedPost, isFeatured: false };
  //   }

  //   if (isAllPosts) {
  //     extendedPost.comments = comments.map((comment) => {
  //       if (comment.likes && comment.replies) {
  //         const commentLikesCount = comment.likes ? comment.likes.length : 0;
  //         comment.likes && delete comment.likes;
  //         comment.replies = comment.replies.map((reply: IComment) => {
  //           const replyLikesCount = reply.likes ? reply.likes.length : 0;
  //           reply.likes && delete reply.likes;
  //           return {
  //             ...reply,
  //             likesCount: replyLikesCount,
  //           };
  //         });
  //         return {
  //           ...comment,
  //           likesCount: commentLikesCount,
  //         };
  //       } else {
  //         return { ...comment };
  //       }
  //     });
  //   } else {
  //     extendedPost.comments && delete extendedPost.comments;
  //   }

  //   return extendedPost;
  // }

  // private async createViewers(
  //   author: IUser,
  // ): Promise<(string | PopulatedDoc<IUser, Types.ObjectId>)[]> {
  //   const initialUsers = [...author.followers, author._id];
  //   const users = await this.getRandomUsers(10, initialUsers);
  //   return [...initialUsers, ...users];
  // }

  // public async updateViewers(
  //   percentage: number,
  //   excludeUsers: (string | PopulatedDoc<IUser, Types.ObjectId>)[],
  // ): Promise<(string | PopulatedDoc<IUser, Types.ObjectId>)[]> {
  //   const users = await this.getRandomUsers(percentage, excludeUsers);
  //   return users;
  // }

  // private async getRandomUsers(
  //   percentage: number,
  //   excludeUsers: (string | PopulatedDoc<IUser, Types.ObjectId>)[],
  // ): Promise<string[]> {
  //   const totalUsers = await this.userModel.countDocuments({});
  //   const amount = Math.round(totalUsers * (percentage / 100));
  //   const users = await this.userModel.aggregate(
  //     [
  //       { $match: { _id: { $nin: excludeUsers } } },
  //       { $sample: { size: amount } },
  //     ],
  //     { allowDiskUse: true },
  //   );
  //   return users.map((user) => user._id.toString());
  // }

  // public async RemoveDeletedUserPosts() {
  //   const allPosts = await this.postModel.find({}).select('_id');
  //   const userPosts = await this.userModel
  //     .find({ myPosts: { $ne: [] } })
  //     .select('myPosts');

  //   const deprecatedPosts = userPosts
  //     .map((user) => user.myPosts.map((post) => post.toString()))
  //     .flat()
  //     .filter(
  //       (post) => !allPosts.map((post) => post._id.toString()).includes(post),
  //     );

  //   for (const post of deprecatedPosts) {
  //     await this.userModel.updateOne(
  //       { myPosts: post },
  //       { $pull: { myPosts: post } },
  //     );
  //   }
  // }

  // private async addPostToUsers(user: IUser, post: IPost) {
  //   const viewers = await this.createViewers(user);
  //   await this.activePostsModel.updateMany(
  //     { user: { $in: viewers } },
  //     { $addToSet: { posts: post._id } },
  //   );
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
