import { Inject, Service } from 'typedi';
import { IUser, IUserInputUpdate } from '../interfaces/IUser';
import ErrorResponse from '../utils/errorResponse';

@Service()
export default class UserService {
  constructor(@Inject('userModel') private userModel: Models.UserModel) {}

  public async GetUserById(currentUser: IUser, userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    return user;
  }

  public async UpdateUserData(
    currentUser: IUser,
    inputUpdateData: IUserInputUpdate,
  ): Promise<IUser> {
    let user = await this.userModel.findOne({ name: currentUser.name }).lean();

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    if (inputUpdateData.name) {
      const isUserNameAlreadyExists = await this.userModel
        .findOne({
          name: inputUpdateData.name,
        })
        .lean();

      if (isUserNameAlreadyExists) {
        throw new ErrorResponse('User with that name already exists!');
      }
    }

    user = await this.userModel.findByIdAndUpdate(
      currentUser._id,
      {
        $set: { ...inputUpdateData },
      },
      { new: true, runValidators: true },
    );

    return user;
  }
}
