import React from "react";
import style from "./Auth.module.scss";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import {
  authEmailLong,
  authEmailShort,
  authPasswordLong,
  authPasswordShort,
} from "../../consts/yup";
import { Link } from "react-router-dom";
import { SIGNIN_ROUTE } from "../../routes/pathes";

const AuthSchema = Yup.object().shape({
  email: Yup.string().min(10, authEmailShort).max(50, authEmailLong),
  password: Yup.string().min(4, authPasswordShort).max(20, authPasswordLong),
});

const AuthPage = () => {
  return (
    <div className={style.wrapper}>
      <div className={style.container}>
        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          validationSchema={AuthSchema}
          onSubmit={() => {
            console.log("submit");
          }}
        >
          {({ errors }) => (
            <Form>
              <div className={style.form}>
                <h1 className={style.formTitle}>Sign up</h1>
                <div className={style.formFields}>
                  <div className={style.formField}>
                    <Field
                      maxlength={51}
                      className={style.inputItem}
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className={style.formField}>
                    <Field
                      maxlength={51}
                      className={style.inputItem}
                      name="email"
                      type="email"
                      placeholder="example@gmail.com"
                      required
                    />
                  </div>
                  <div className={style.formField}>
                    <Field
                      maxlength={51}
                      className={style.inputItem}
                      name="password"
                      type="password"
                      placeholder="Your password"
                      required
                    />
                  </div>
                  <div className={style.formField}>
                    <Field
                      maxlength={51}
                      className={style.inputItem}
                      name="password"
                      type="password"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
                <div className={style.formFooter}>
                  <button className={style.submitBtn} type="submit">
                    Sign up
                  </button>
                  <div className={style.formFooterNavigation}>
                    <div className={style.formNavigation}>
                      <p className={style.questionTag}>
                        Already have an account?
                      </p>
                      <Link className={style.link} to={SIGNIN_ROUTE}>
                        Sign in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AuthPage;
