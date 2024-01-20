import { Service, Inject, Container } from 'typedi';
import { Document, ObjectId, PopulatedDoc, Types } from 'mongoose';
import { IArticle, IArticleInput } from '../interfaces/IArticle';
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

@Service()
export default class PostService {
  constructor(
    @Inject('articleModel') private articleModel: Models.ArticleModel,
    @Inject('commentModel') private commentModel: Models.CommentModel,
    @Inject('userModel') private userModel: Models.UserModel,
  ) {}

  public async Create(
    req: Request & { file: MulterFile },
    articleInput: IArticleInput,
    user: IUser,
  ): Promise<IArticle> {
    let uploadedImage;
    try {
      uploadedImage = await this.uploadFile(req.file.path);
    } catch (e) {
      throw new ErrorResponse('The error occurred with uploading image');
    }

    if (!articleInput.title) {
      throw new ErrorResponse('The article does not contain a title');
    }

    if (!articleInput.description) {
      throw new ErrorResponse('Describe you article');
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

  // public async CreateBotPostsAndCommentsJob(botLimit: number): Promise<any> {
  //   const randomBots = await this.userModel.aggregate([
  //     { $match: { isUserBot: true } },
  //     { $sample: { size: botLimit } },
  //   ]);
  //   let time: number;

  //   for (const bot of randomBots) {
  //     time = Math.floor(Math.random() * (1430 - 1 + 1)) + 1;

  //     await this.agendaInstance.schedule(
  //       `in ${time} minutes`,
  //       'createBotPostsAndComments',
  //       {
  //         bot: bot,
  //       },
  //     );
  //   }
  // }

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

  // public async Favourite(currentPostId: string, user: IUser): Promise<IPost> {
  //   const userServiceInstance = Container.get(UserService);
  //   const notActiveIds = await userServiceInstance.GetNotActiveIds(user);
  //   const post = await this.postModel
  //     .findById(currentPostId)
  //     .populate('author')
  //     .populate({
  //       path: 'comments',
  //       select: 'text isAuthor author createdAt',
  //       match: { author: { $nin: notActiveIds } },
  //       options: {
  //         sort: { createdAt: 1 },
  //       },
  //       populate: {
  //         path: 'author',
  //       },
  //     })
  //     .populate({
  //       path: 'authorComment',
  //       select: 'text isAuthor createdAt',
  //       populate: {
  //         path: 'author',
  //       },
  //     })
  //     .lean();
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   const isSaved = user.favouritePosts.some(
  //     (postId) => postId.toString() === post._id.toString(),
  //   );
  //   const authorId = post.author._id.toString();
  //   const isAuthor = authorId === user._id.toString();
  //   if (isSaved) {
  //     await this.userModel
  //       .findByIdAndUpdate(
  //         user._id,
  //         { $pull: { favouritePosts: new Types.ObjectId(currentPostId) } },
  //         { new: true },
  //       )
  //       .lean();
  //     this.updateRank(-config.weight.save, post._id.toString());
  //   } else {
  //     await this.userModel
  //       .findByIdAndUpdate(
  //         user._id,
  //         { $push: { favouritePosts: new Types.ObjectId(currentPostId) } },
  //         { new: true },
  //       )
  //       .lean();
  //     this.updateRank(config.weight.save, post._id.toString());
  //     if (!isAuthor) {
  //       const userAuthor = await this.userModel
  //         .findOne({
  //           _id: authorId,
  //         })
  //         .select('language');
  //       const notificationServiceInstance = Container.get(NotificationService);
  //       notificationServiceInstance.SendPush({
  //         user: authorId,
  //         content: i18next.t('post_saved', {
  //           username: user.username,
  //           lng: userAuthor?.language,
  //         }),
  //         type: NotificationType.savesNotifications,
  //         sender: user._id.toString(),
  //         post: post._id.toString(),
  //         data: {
  //           postId: post._id.toString(),
  //         },
  //       });
  //     }
  //   }
  //   const isLiked = post.likes.some(
  //     (userId) => userId.toString() === user._id.toString(),
  //   );
  //   const isDisliked = post.dislikes.some(
  //     (userId) => userId.toString() === user._id.toString(),
  //   );
  //   return {
  //     ...post,
  //     isAuthor,
  //     isSaved: !isSaved,
  //     isLiked,
  //     isDisliked,
  //     totalComments: post.comments ? post.comments.length : 0,
  //   };
  // }

  // public async FavouriteV3(
  //   currentPostId: string,
  //   user: IUser,
  //   isFavourited: boolean,
  // ): Promise<any> {
  //   const post = await this.postModel.findById(currentPostId).lean();
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }

  //   const isSaved = user.favouritePosts.some(
  //     (postId) => postId.toString() === post._id.toString(),
  //   );

  //   const authorId = post.author.toString();
  //   const isAuthor = authorId === user._id.toString();

  //   if (isFavourited && !isSaved) {
  //     await this.userModel
  //       .findByIdAndUpdate(
  //         user._id,
  //         { $addToSet: { favouritePosts: new Types.ObjectId(currentPostId) } },
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
  //         content: i18next.t('post_saved', {
  //           username: user.username,
  //           lng: userAuthor?.language,
  //         }),
  //         type: NotificationType.savesNotifications,
  //         sender: user._id.toString(),
  //         post: post._id.toString(),
  //         data: {
  //           postId: post._id.toString(),
  //         },
  //       });
  //     }
  //     this.updateRank(config.weight.save, post._id.toString());
  //   }
  //   if (isSaved && !isFavourited) {
  //     await this.userModel
  //       .findByIdAndUpdate(
  //         user._id,
  //         { $pull: { favouritePosts: new Types.ObjectId(currentPostId) } },
  //         { new: true },
  //       )
  //       .lean();
  //     this.updateRank(-config.weight.save, post._id.toString());
  //   }
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

  // public async Like(currentPostId: string, user: IUser): Promise<IPost> {
  //   let post = await this.postModel
  //     .findById(currentPostId)
  //     .select('likes author');
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   const isLiked = post.likes.some(
  //     (userId) => userId.toString() === user._id.toString(),
  //   );
  //   const userServiceInstance = Container.get(UserService);
  //   const notActiveIds = await userServiceInstance.GetNotActiveIds(user);
  //   const authorId = post.author.toString();
  //   const isAuthor = authorId === user._id.toString();
  //   if (isLiked) {
  //     post = await this.postModel
  //       .findByIdAndUpdate(
  //         currentPostId,
  //         {
  //           $pull: { likes: user._id },
  //         },
  //         { new: true },
  //       )
  //       .populate('author')
  //       .populate({
  //         path: 'comments',
  //         select: 'text isAuthor author createdAt',
  //         match: { author: { $nin: notActiveIds } },
  //         options: {
  //           sort: { createdAt: 1 },
  //         },
  //         populate: {
  //           path: 'author',
  //         },
  //       })
  //       .populate({
  //         path: 'authorComment',
  //         select: 'text isAuthor createdAt',
  //         populate: {
  //           path: 'author',
  //         },
  //       })
  //       .lean();
  //     this.updateRank(-config.weight.like, post._id.toString());
  //   } else {
  //     post = await this.postModel
  //       .findByIdAndUpdate(
  //         currentPostId,
  //         {
  //           $push: { likes: user._id },
  //           $pull: { dislikes: user._id },
  //         },
  //         { new: true },
  //       )
  //       .populate('author')
  //       .populate({
  //         path: 'comments',
  //         select: 'text isAuthor author createdAt',
  //         match: { author: { $nin: notActiveIds } },
  //         options: {
  //           sort: { createdAt: 1 },
  //         },
  //         populate: {
  //           path: 'author',
  //         },
  //       })
  //       .populate({
  //         path: 'authorComment',
  //         select: 'text isAuthor createdAt',
  //         populate: {
  //           path: 'author',
  //         },
  //       })
  //       .lean();
  //     this.updateRank(config.weight.like, post._id.toString());
  //     if (!isAuthor) {
  //       const userAuthor = await this.userModel
  //         .findOne({
  //           _id: authorId,
  //         })
  //         .select('language');
  //       const notificationServiceInstance = Container.get(NotificationService);
  //       notificationServiceInstance.SendPush({
  //         user: authorId,
  //         content: i18next.t('post_liked', {
  //           username: user.username,
  //           lng: userAuthor?.language,
  //         }),
  //         type: NotificationType.likesNotifications,
  //         sender: user._id.toString(),
  //         post: post._id.toString(),
  //         data: {
  //           postId: post._id.toString(),
  //         },
  //       });
  //     }
  //   }
  //   const isDisliked = post.dislikes.some(
  //     (userId) => userId.toString() === user._id.toString(),
  //   );
  //   const isSaved = user.favouritePosts.some(
  //     (postId) => postId.toString() === post._id.toString(),
  //   );
  //   const author = post.author as IUser;
  //   ((post.authorComment as IComment).author as IUser).isFollowed = (
  //     (post.authorComment as IComment).author as IUser
  //   ).followers?.some(
  //     (followerId) => user._id.toString() === followerId.toString(),
  //   );
  //   const comments = post.comments.slice(0, 2).map((comment) => {
  //     const isFollowed = (
  //       (comment as IComment).author as IUser
  //     ).followers?.some(
  //       (followerId) => user._id.toString() === followerId.toString(),
  //     );
  //     ((comment as IComment).author as IUser).isFollowed = isFollowed;
  //     return comment;
  //   });
  //   author.isFollowed = (post.author as IUser).followers?.some(
  //     (followerId) => user._id.toString() === followerId.toString(),
  //   );
  //   return {
  //     ...post,
  //     author,
  //     comments,
  //     isAuthor,
  //     isLiked: !isLiked,
  //     isDisliked,
  //     isSaved,
  //     totalComments: post.comments.length,
  //   };
  // }

  // public async LikeV3(
  //   currentPostId: string,
  //   user: IUser,
  //   isLiked: boolean,
  // ): Promise<any> {
  //   const challengesServiceInstance = Container.get(ChallengesService);
  //   const notificationServiceInstance = Container.get(NotificationService);

  //   let post = await this.postModel
  //     .findById(currentPostId)
  //     .select('likes author challenge');
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }

  //   let firstPlaceUser;
  //   if (post?.challenge) {
  //     const challenge = await this.challengesModel.findOne({
  //       _id: post.challenge,
  //     });

  //     if (challenge.status === ChallengeStatus.ACTIVE) {
  //       const leaderboard =
  //         await challengesServiceInstance.GetChallengeLeaderboard(
  //           challenge._id,
  //           user,
  //         );
  //       firstPlaceUser = leaderboard.find((user) => user.position === 1);
  //     }
  //   }
  //   const isPostLiked = post.likes.some(
  //     (userId) => userId.toString() === user._id.toString(),
  //   );
  //   const authorId = post.author.toString();
  //   const isAuthor = authorId === user._id.toString();
  //   if (isLiked && !isPostLiked) {
  //     post = await this.postModel
  //       .findByIdAndUpdate(
  //         currentPostId,
  //         {
  //           $addToSet: { likes: user._id },
  //           $pull: { dislikes: user._id },
  //         },
  //         { new: true },
  //       )
  //       .lean();
  //     if (!isAuthor) {
  //       const userAuthor = await this.userModel
  //         .findOne({
  //           _id: authorId,
  //         })
  //         .select('language');
  //       notificationServiceInstance.SendPush({
  //         user: authorId,
  //         content: i18next.t('post_liked', {
  //           username: user.username,
  //           lng: userAuthor?.language,
  //         }),
  //         type: NotificationType.likesNotifications,
  //         sender: user._id.toString(),
  //         post: post._id.toString(),
  //         data: {
  //           postId: post._id.toString(),
  //         },
  //       });
  //     }
  //     this.updateRank(config.weight.like, post._id.toString());
  //   }
  //   if (isPostLiked && !isLiked) {
  //     post = await this.postModel
  //       .findByIdAndUpdate(
  //         currentPostId,
  //         {
  //           $pull: { likes: user._id },
  //         },
  //         { new: true },
  //       )
  //       .lean();
  //     this.updateRank(-config.weight.like, post._id.toString());
  //   }

  //   let anotherFirstPlaceUser;
  //   if (post?.challenge) {
  //     const challenge = await this.challengesModel.findOne({
  //       _id: post.challenge,
  //     });

  //     if (challenge.status === ChallengeStatus.ACTIVE) {
  //       const leaderboard =
  //         await challengesServiceInstance.GetChallengeLeaderboard(
  //           challenge._id,
  //           user,
  //         );
  //       anotherFirstPlaceUser = leaderboard.find((user) => user.position === 1);

  //       if (
  //         firstPlaceUser.user._id.toString() !==
  //         anotherFirstPlaceUser.user._id.toString()
  //       ) {
  //         notificationServiceInstance.SendPush({
  //           user: firstPlaceUser.user._id.toString(),
  //           content: `⚠️ Alert! You've been nudged to 2nd place. Reclaim your throne and aim for the top spot! 🚀`,
  //           type: NotificationType.challengeNotifications,
  //           data: {
  //             challengeId: challenge._id.toString(),
  //           },
  //         });
  //       }
  //     }
  //   }
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

  // public async GetUserPosts(
  //   params: IPaginationParams & IPostParams,
  //   user: IUser,
  // ): Promise<IPostData> {
  //   let limit = params.limit ? +params.limit : 0;
  //   const offset = params.offset ? +params.offset : 0;
  //   const shadowHiddenPost = await this.hiddenPostIds(user);
  //   const query: any = {};

  //   if (params.user_id && params.post_id && params.forward) {
  //     query.author = new Types.ObjectId(params.user_id);
  //     if (+params.forward) {
  //       query._id = { $gte: new Types.ObjectId(params.post_id) };
  //     } else {
  //       query._id = { $lte: new Types.ObjectId(params.post_id) };
  //     }
  //     ++limit;
  //   } else if (+params.my && params.post_id && params.forward) {
  //     query.author = new Types.ObjectId(user._id);
  //     if (+params.forward) {
  //       query._id = { $gte: new Types.ObjectId(params.post_id) };
  //     } else {
  //       query._id = { $lte: new Types.ObjectId(params.post_id) };
  //     }
  //     ++limit;
  //   } else if (+params.saved && params.post_id && params.forward) {
  //     if (+params.forward) {
  //       query.$and = [
  //         { _id: { $in: user.favouritePosts } },
  //         { _id: { $gte: new Types.ObjectId(params.post_id) } },
  //       ];
  //     } else {
  //       query.$and = [
  //         { _id: { $in: user.favouritePosts } },
  //         { _id: { $lte: new Types.ObjectId(params.post_id) } },
  //       ];
  //     }
  //     ++limit;
  //   } else {
  //     if (shadowHiddenPost.length) {
  //       query._id = { $nin: shadowHiddenPost };
  //     }
  //     if (+params.saved) {
  //       query._id = { $in: user.favouritePosts };
  //     }
  //     if (+params.my) {
  //       query.author = user._id;
  //     }
  //     if (params.user_id) {
  //       query.author = new Types.ObjectId(params.user_id);
  //     }
  //   }

  //   const data: IPostData = {
  //     total: 0,
  //     result: [],
  //     nextPostsAvailable: false,
  //   };

  //   const posts = await this.postModel
  //     .find(query, {
  //       author: 1,
  //       authorComment: 1,
  //       createdAt: 1,
  //       updatedAt: 1,
  //       image: 1,
  //       thumbImage: 1,
  //       shadowHide: 1,
  //       likes: 1,
  //       dislikes: 1,
  //       comments: 1,
  //       generation: 1,
  //       isFeatured: 1,
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
  //     .sort(+params.forward === 1 ? { _id: 1 } : '-createdAt')
  //     .skip(offset)
  //     .limit(limit)
  //     .lean();

  //   const isDoublePagination = params?.post_id ? true : false;
  //   data.result = await Promise.all(
  //     posts.map(async (post) => {
  //       const extendedPost = await this.extendPostV3(
  //         post,
  //         user,
  //         isDoublePagination,
  //       );
  //       return extendedPost;
  //     }),
  //   );

  //   data.total = await this.postModel.countDocuments(query);
  //   data.nextPostsAvailable = data.total - limit > 0 ? true : false;
  //   return data;
  // }

  // public async GetByIdV3(
  //   postId: string,
  //   user: IUser,
  //   version = 2,
  // ): Promise<IPost> {
  //   let post = await this.postModel
  //     .findById(postId, {
  //       author: 1,
  //       authorComment: 1,
  //       createdAt: 1,
  //       updatedAt: 1,
  //       image: 1,
  //       thumbImage: 1,
  //       shadowHide: 1,
  //       likes: 1,
  //       dislikes: 1,
  //       comments: 1,
  //       generation: 1,
  //       isFeatured: 1,
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
  //         sort: { createdAt: version === 2 ? 1 : -1 },
  //       },
  //       populate: [
  //         {
  //           path: 'author',
  //           select:
  //             'username name email role status gender avatar isUserBot createdAt updatedAt',
  //         },
  //         {
  //           path: 'replies',
  //           options: {
  //             sort: { createdAt: version === 2 ? 1 : -1 },
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
  //       populate: {
  //         path: 'author',
  //       },
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
  //     .lean();
  //   post = await this.extendPostV3(post, user);

  //   return post;
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

  // public async Remove(postId: string, user: IUser): Promise<void> {
  //   const post = await this.postModel.findById(postId);
  //   if (!post) {
  //     throw new ErrorResponse(
  //       i18next.t('post_not_found', { lng: user?.language }),
  //       404,
  //     );
  //   }
  //   if (post.author.toString() !== user._id.toString()) {
  //     throw new ErrorResponse(
  //       i18next.t('not_post_author', { lng: user?.language }),
  //       400,
  //     );
  //   }

  //   if (post.challenge) {
  //     const challengePosts = await this.postModel.find({
  //       challenge: post.challenge,
  //     });
  //     if (challengePosts.length <= 1) {
  //       await this.userModel.findOneAndUpdate(
  //         { _id: user._id },
  //         { $pull: { challenges: post.challenge } },
  //       );
  //     }
  //   }

  //   await this.postModel.findOneAndDelete({ _id: postId });
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
}
