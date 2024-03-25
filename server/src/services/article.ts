import { Service, Inject } from 'typedi';
import { Document, Types } from 'mongoose';
import {
  IArticle,
  IArticleData,
  IArticleInput,
  IArticleParams,
} from '../interfaces/IArticle';
import { IComment, ICommentInput } from '../interfaces/IComments';
import { IUser } from '../interfaces/IUser';
import ErrorResponse from '../utils/errorResponse';
import { IPagination } from '../interfaces/IPagination';
import cloudinary from '../storage/cloudinary';
import moment from 'moment';
import { Request, Response } from 'express';
import { MulterFile } from '../interfaces/IMulter';
import multer from 'multer';
import { ICategory } from '../interfaces/ICategory';

@Service()
export default class ArticleService {
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

    try {
      await this.userModel.findByIdAndUpdate(user._id, {
        $addToSet: { myArticles: article._id },
      });
    } catch (e) {
      throw new ErrorResponse('Something went wrong with creating article');
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

  public async GetTheMostPopularArticle(): Promise<IArticle> {
    let articles = await this.articleModel.find({
      createdAt: { $gte: moment().subtract(30, 'days').toDate() },
    });

    articles = articles.sort((a, b) => b.likes.length - a.likes.length);

    return articles[0];
  }

  public async CreateCommentReply(
    commentInput: ICommentInput,
    commentId: string,
    user: IUser,
  ): Promise<IComment | any> {
    const parentComment = await this.commentModel.findById(commentId);

    if (!parentComment) {
      throw new ErrorResponse('Comment not found', 404);
    }

    const mainParent = parentComment.mainParent || commentId;
    let comment = await this.commentModel.create({
      text: commentInput.text,
      mainParent,
      parent: commentId,
      article: parentComment.article,
      author: user._id,
    });
    comment = await comment.populate('author');
    await this.commentModel.findByIdAndUpdate(commentId, {
      $push: { replies: comment._id },
    });

    return comment;
  }

  public async LikeComment(
    currentCommentId: string,
    user: IUser,
    toLike: boolean,
  ): Promise<any> {
    let comment = await this.commentModel
      .findById(currentCommentId)
      .populate('author', 'username avatar')
      .lean();

    if (!comment) {
      throw new ErrorResponse('Comment not found', 404);
    }

    const isCommentLiked =
      comment.likes &&
      comment.likes.some((userId) => userId.toString() === user._id.toString());

    if (toLike && !isCommentLiked) {
      comment = await this.commentModel
        .findByIdAndUpdate(
          currentCommentId,
          { $addToSet: { likes: user._id } },
          { new: true },
        )
        .lean();
    }
    if (!toLike && isCommentLiked) {
      comment = await this.commentModel
        .findByIdAndUpdate(
          currentCommentId,
          { $pull: { likes: user._id } },
          { new: true },
        )
        .lean();
    }
  }

  public async DeleteComment(commentId: string, user: IUser): Promise<void> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new ErrorResponse('Comment not found', 404);
    }
    if (comment.author.toString() !== user._id.toString()) {
      throw new ErrorResponse('You are not the author of the comment', 400);
    }
    await this.commentModel.findOneAndDelete({ _id: commentId });
  }

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
