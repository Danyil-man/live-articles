import { Service, Inject, Container } from 'typedi';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';
import { AuthType, IUser, IUserInputDTO } from '../interfaces/IUser';
import ErrorResponse from '../utils/errorResponse';
//import generatePassword from '../utils/generatePassword';
import config from '../config';

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

  // public async AppleAuth(
  //   accessToken: string,
  //   appleId: string,
  //   appleName: string,
  // ): Promise<{ user: IUser; token: string; authType?: AuthType }> {
  //   const userRecordId = await this.userModel.findOne({ appleId });
  //   const response = await this.appleAuth.accessToken(accessToken);
  //   if (!response && !response.id_token) {
  //     throw new ErrorResponse(
  //       i18next.t('apple_authentication_fail', { lng: userRecordId?.language }),
  //       401,
  //     );
  //   }
  //   const idToken: any = jwt.decode(response.id_token);
  //   if (!idToken && !idToken.email) {
  //     throw new ErrorResponse(
  //       i18next.t('apple_authentication_fail', { lng: userRecordId?.language }),
  //       401,
  //     );
  //   }
  //   if (userRecordId) {
  //     if (userRecordId.status === Status.BLOCKED) {
  //       throw new ErrorResponse('User blocked', 403);
  //     }
  //     if (userRecordId.email !== idToken.email) {
  //       throw new ErrorResponse(
  //         i18next.t('apple_authentication_fail', {
  //           lng: userRecordId?.language,
  //         }),
  //         401,
  //       );
  //     }
  //     return this.getToken(userRecordId, AuthType.SIGNIN);
  //   }
  //   let userRecordEmail = await this.userModel.findOne({
  //     email: idToken.email,
  //   });
  //   if (userRecordEmail) {
  //     userRecordEmail = await this.userModel.findOneAndUpdate(
  //       { email: idToken.email },
  //       { appleId },
  //       { new: true },
  //     );
  //     return this.getToken(userRecordEmail, AuthType.SIGNIN);
  //   }
  //   let username = '';
  //   if (appleName) {
  //     const normalizedUsername = normalizeUsername(appleName);
  //     const userRecordName = await this.userModel.findOne({
  //       username: normalizedUsername,
  //     });
  //     if (userRecordName) {
  //       username = normalizedUsername + Date.now();
  //     } else {
  //       username = normalizedUsername;
  //     }
  //   } else {
  //     username = 'user_' + Date.now();
  //   }
  //   const userRecord = await this.createUser({
  //     username,
  //     email: idToken.email,
  //     appleId,
  //     isEmailConfirmed: true,
  //     status: Status.ACTIVE,
  //   });
  //   return this.getToken(userRecord, AuthType.SIGNUP);
  // }

  // public async Check(userInputDTO: IUserInputDTO, req: any): Promise<void> {
  //   if (userInputDTO.email === '') {
  //     throw new ErrorResponse(req.t('not_empty_email'), 401, 'email');
  //   }
  //   if (userInputDTO.username === '') {
  //     throw new ErrorResponse(req.t('not_empty_username'), 401, 'username');
  //   }
  //   if (userInputDTO.email) {
  //     const email = userInputDTO.email.toLowerCase();
  //     const isEmail = await this.userModel.findOne({ email });
  //     if (isEmail) {
  //       throw new ErrorResponse(req.t('email_already_exists'), 401, 'email');
  //     }
  //   }
  //   if (userInputDTO.username) {
  //     const isUsername = await this.userModel.findOne({
  //       username: userInputDTO.username,
  //     });
  //     if (isUsername) {
  //       throw new ErrorResponse(
  //         req.t('username_already_exsists'),
  //         401,
  //         'username',
  //       );
  //     }
  //   }
  // }

  // public async CheckCode(code: string, userRecord: IUser): Promise<void> {
  //   const confirmationCodeToken = crypto
  //     .createHash('sha256')
  //     .update(code)
  //     .digest('hex');
  //   const user = await this.userModel.findOne({
  //     _id: userRecord._id,
  //     confirmationCodeToken,
  //     confirmationCodeExpire: { $gt: Date.now() },
  //   });

  //   if (!user) {
  //     throw new ErrorResponse(
  //       i18next.t('invalid_code', { lng: userRecord?.language }),
  //       400,
  //     );
  //   }
  //   user.confirmationCodeToken = undefined;
  //   user.confirmationCodeExpire = undefined;
  //   user.isEmailConfirmed = true;
  //   user.status = Status.ACTIVE;
  //   await user.save();
  // }

  // public async GetConfirmationCode(userRecord: IUser): Promise<void> {
  //   const user = await this.userModel.findById(userRecord._id);
  //   if (user) {
  //     await this.SendConfirmationCode(user);
  //   }
  // }

  // public async UpdatePassword(
  //   currentUser: IUser,
  //   currentPassword: string,
  //   newPassword: string,
  // ): Promise<{ user: IUser; token: string }> {
  //   const userRecord = await this.userModel
  //     .findById(currentUser._id)
  //     .select('+password');
  //   if (!userRecord) {
  //     throw new ErrorResponse(
  //       i18next.t('user_not_registered', { lng: currentUser?.language }),
  //       400,
  //     );
  //   }
  //   if (userRecord.status === Status.DELETED) {
  //     throw new ErrorResponse(
  //       i18next.t('user_deleted', { lng: currentUser?.language }),
  //       400,
  //     );
  //   }
  //   if (userRecord.status === Status.BLOCKED) {
  //     throw new ErrorResponse('User blocked', 400);
  //   }
  //   const validPassword = await userRecord.matchPassword(currentPassword);
  //   if (validPassword) {
  //     userRecord.password = newPassword;
  //     await userRecord.save();
  //     return this.getToken(userRecord);
  //   } else {
  //     throw new ErrorResponse(
  //       i18next.t('incorrect_password', { lng: currentUser?.language }),
  //       400,
  //     );
  //   }
  // }

  // public async ResetPassword(email: string): Promise<boolean> {
  //   const userRecord = await this.userModel.findOne({ email });
  //   if (!userRecord) {
  //     throw new ErrorResponse(
  //       i18next.t('user_not_registered', { lng: userRecord?.language }),
  //       400,
  //     );
  //   }
  //   if (userRecord.status === Status.DELETED) {
  //     throw new ErrorResponse(
  //       i18next.t('user_deleted', { lng: userRecord?.language }),
  //       400,
  //     );
  //   }
  //   if (userRecord.status === Status.BLOCKED) {
  //     throw new ErrorResponse('User blocked', 400);
  //   }
  //   const newPassword = generatePassword({ length: 8 });
  //   userRecord.password = newPassword;
  //   await userRecord.save();
  //   const mailServiceInstance = Container.get(MailService);
  //   const result = await mailServiceInstance.SendEmail({
  //     email,
  //     name: userRecord.username,
  //     template: TemplateType.resetPassword,
  //     actionData: {
  //       newPassword,
  //       user: userRecord,
  //     },
  //   });
  //   return result;
  // }

  private async createUser(userData: IUserInputDTO): Promise<IUser & Document> {
    const userRecord = await this.userModel.create({
      ...userData,
    });

    return userRecord;
  }

  // private async SendConfirmationCode(
  //   userRecord: IUser & Document,
  // ): Promise<void> {
  //   const code = userRecord.getConfirmationCode();
  //   await userRecord.save({ validateBeforeSave: false });
  //   const mailServiceInstance = Container.get(MailService);
  //   await mailServiceInstance.SendConfirmationCode(userRecord, code);
  // }

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
