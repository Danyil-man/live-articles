import { Service, Inject, Container } from 'typedi';
import { Document } from 'mongoose';
import { AuthType, IUser, IUserInputDTO } from '../interfaces/IUser';
import ErrorResponse from '../utils/errorResponse';

@Service()
export default class AuthService {
  constructor(@Inject('userModel') private userModel: Models.UserModel) {}

  public async SignUp(
    userInputDTO: IUserInputDTO,
  ): Promise<{ user: IUser; token: string; authType?: AuthType }> {
    const email = userInputDTO.email.toLowerCase();
    const userRecord = await this.createUser({
      ...userInputDTO,
      email,
    });
    return this.getToken(userRecord, AuthType.SIGNUP);
  }

  public async SignIn(
    email: string,
    password: string,
  ): Promise<{ user: IUser; token: string; authType?: AuthType }> {
    const emailString = email.toLowerCase();
    const userRecord = await this.userModel
      .findOne({ $or: [{ email: emailString }, { name: email }] })
      .select('+password');

    if (!userRecord) {
      throw new ErrorResponse('Еhe user is not registered', 401, 'email');
    }

    const validPassword = await userRecord.matchPassword(password);

    if (validPassword) {
      return this.getToken(userRecord, AuthType.SIGNIN);
    } else {
      throw new ErrorResponse('Invalid password', 401, 'password');
    }
  }

  public async Check(userInputDTO: IUserInputDTO, req: any): Promise<void> {
    if (userInputDTO.email === '') {
      throw new ErrorResponse('Email cannot be empty!', 401);
    }
    if (userInputDTO.name === '') {
      throw new ErrorResponse('Name cannot be empty!', 401);
    }
    if (userInputDTO.email) {
      const email = userInputDTO.email.toLowerCase();
      const isEmail = await this.userModel.findOne({ email });
      if (isEmail) {
        throw new ErrorResponse('Email already exist!', 401);
      }
    }
    if (userInputDTO.name) {
      const isUsername = await this.userModel.findOne({
        name: userInputDTO.name,
      });
      if (isUsername) {
        throw new ErrorResponse('Name already exist!', 401);
      }
    }
  }

  public async UpdatePassword(
    currentUser: IUser,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ user: IUser; token: string }> {
    const userRecord = await this.userModel
      .findById(currentUser._id)
      .select('+password');
    if (!userRecord) {
      throw new ErrorResponse('The user is not registered', 400);
    }

    const validPassword = await userRecord.matchPassword(currentPassword);
    if (validPassword) {
      userRecord.password = newPassword;
      await userRecord.save();
      return this.getToken(userRecord);
    } else {
      throw new ErrorResponse('The password is incorrect!', 400);
    }
  }

  private async createUser(userData: IUserInputDTO): Promise<IUser & Document> {
    const userRecord = await this.userModel.create({
      ...userData,
    });

    return userRecord;
  }

  private async getToken(
    userRecord: IUser & Document,
    authType?: AuthType,
  ): Promise<any> {
    const token = userRecord.getSignedJwtToken();
    const user = userRecord.toObject();
    Reflect.deleteProperty(user, 'password');
    Reflect.deleteProperty(user, 'confirmationCodeToken');
    Reflect.deleteProperty(user, 'confirmationCodeExpire');
    return { user, token, authType };
  }
}
