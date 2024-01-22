import { Service, Inject, Container } from 'typedi';
import { Document } from 'mongoose';
import { AuthType, IUser, IUserInputDTO } from '../interfaces/IUser';
import ErrorResponse from '../utils/errorResponse';
import { ICategory, ICategoryInput } from '../interfaces/ICategory';

@Service()
export default class CategoryService {
  constructor(
    @Inject('categoryModel') private categoryModel: Models.CategoryModel,
  ) {}

  public async Create(body: ICategoryInput): Promise<ICategory> {
    const categoryName = body.name.trim();
    if (!categoryName) {
      throw new ErrorResponse('Category name does not provided');
    }

    let category: ICategory;
    try {
      category = await this.categoryModel.create({ name: categoryName });
    } catch (e) {
      throw new ErrorResponse('The error occurred wit hcreating category');
    }

    return category;
  }

  public async GetAllCategories(): Promise<ICategory[]> {
    let categories: ICategory[];
    try {
      categories = await this.categoryModel.find({});
    } catch (e) {
      throw new ErrorResponse('The error occurred wit hcreating category');
    }

    return categories;
  }
}
