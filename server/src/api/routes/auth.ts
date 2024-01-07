import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { celebrate, Joi } from 'celebrate';
import AuthService from '../../services/auth';
import { IUserInputDTO } from '../../interfaces/IUser';
import middlewares from '../middlewares';

const route = Router();

export default (app: Router): void => {
  app.use('/auth', route);

  route.post(
    '/signup',
    celebrate({
      body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string()
          .email({ tlds: { allow: false } })
          .required(),
        password: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authServiceInstance = Container.get(AuthService);
        const { user, token, authType } = await authServiceInstance.SignUp(
          req.body as IUserInputDTO,
        );
        return res
          .status(201)
          .json({ success: true, data: { user, token, authType } });
      } catch (e) {
        return next(e);
      }
    },
  );

  route.post(
    '/signin',
    celebrate({
      body: Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body;
        const authServiceInstance = Container.get(AuthService);
        const { user, token, authType } = await authServiceInstance.SignIn(
          email,
          password,
        );
        return res
          .status(200)
          .json({ success: true, data: { user, token, authType } });
      } catch (e) {
        return next(e);
      }
    },
  );

  //   route.post(
  //     '/check',
  //     celebrate({
  //       body: Joi.object({
  //         username: Joi.string().allow(''),
  //         email: Joi.string()
  //           .email({ tlds: { allow: false } })
  //           .allow(''),
  //       }),
  //     }),
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const authServiceInstance = Container.get(AuthService);
  //         await authServiceInstance.Check(req.body, req);
  //         return res.status(201).json({ success: true });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/demo',
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const authServiceInstance = Container.get(AuthService);
  //         const { user, token, authType } = await authServiceInstance.SignIn(
  //           'demo@soart.ai',
  //           '11111111',
  //         );
  //         return res
  //           .status(200)
  //           .json({ success: true, data: { user, token, authType } });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/apple',
  //     celebrate({
  //       body: Joi.object({
  //         appleToken: Joi.string().required(),
  //         appleUid: Joi.string().required(),
  //         appleName: Joi.string().allow(''),
  //       }),
  //     }),
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const { appleToken, appleUid, appleName } = req.body;
  //         const authServiceInstance = Container.get(AuthService);
  //         const { user, token, authType } = await authServiceInstance.AppleAuth(
  //           appleToken,
  //           appleUid,
  //           appleName,
  //         );
  //         return res
  //           .status(200)
  //           .json({ success: true, data: { user, token, authType } });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/code',
  //     celebrate({
  //       body: Joi.object({
  //         code: Joi.string().required(),
  //       }),
  //     }),
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const authServiceInstance = Container.get(AuthService);
  //         await authServiceInstance.CheckCode(req.body.code, req.currentUser);
  //         return res.status(200).json({ success: true });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.get(
  //     '/code',
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const authServiceInstance = Container.get(AuthService);
  //         await authServiceInstance.GetConfirmationCode(req.currentUser);
  //         return res.status(200).json({ success: true });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/update-password',
  //     celebrate({
  //       body: Joi.object({
  //         currentPassword: Joi.string().required(),
  //         newPassword: Joi.string().required(),
  //       }),
  //     }),
  //     middlewares.isAuth,
  //     middlewares.attachCurrentUser,
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const { currentPassword, newPassword } = req.body;
  //         const authServiceInstance = Container.get(AuthService);
  //         const { user, token } = await authServiceInstance.UpdatePassword(
  //           req.currentUser,
  //           currentPassword,
  //           newPassword,
  //         );
  //         return res.status(200).json({ success: true, data: { user, token } });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/reset-password',
  //     celebrate({
  //       body: Joi.object({
  //         email: Joi.string().email({ tlds: { allow: false } }),
  //       }),
  //     }),
  //     async (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         const { email } = req.body;
  //         const authServiceInstance = Container.get(AuthService);
  //         await authServiceInstance.ResetPassword(email);
  //         return res.status(200).json({ success: true });
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );

  //   route.post(
  //     '/logout',
  //     middlewares.isAuth,
  //     (req: Request, res: Response, next: NextFunction) => {
  //       try {
  //         return res.status(200).json({ success: true }).end();
  //       } catch (e) {
  //         return next(e);
  //       }
  //     },
  //   );
};
