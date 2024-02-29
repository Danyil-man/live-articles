import AuthPage from "../pages/auth/Auth";
import HomePage from "../pages/home/Home";
import { HOME_ROUTE, SIGNIN_ROUTE, SIGNUP_ROUTE } from "./pathes";

export const signedRoutes = [{ path: HOME_ROUTE, component: HomePage }];

export const publicRoutes = [
  {
    path: SIGNIN_ROUTE,
    component: AuthPage,
  },
  {
    path: SIGNUP_ROUTE,
    component: AuthPage,
  },
];
