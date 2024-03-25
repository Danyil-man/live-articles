import React, { useState } from "react";
import style from "./Auth.module.scss";
import {
  authUsernameLong,
  authUsernameShort,
  authUsernameInvalid,
  emailInvalid,
  authPasswordLong,
  authPasswordShort,
} from "../../consts/validationForm";
import TextField from "@mui/material/TextField";
import { Link } from "react-router-dom";
import { SIGNIN_ROUTE } from "../../routes/pathes";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  FilledInput,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
  Typography,
} from "@mui/material";

const AuthPage = () => {
  const passwordStrengthLables = ["weak", "medium", "strong"];
  const [passwordStrength, setPasswordStrength] = useState("");

  const [usernameValue, setUsername] = useState("");
  const [emailValue, setEmail] = useState("");
  const [passwordValue, setPassword] = useState("");
  const [confirmPasswordValue, setConfirmPassword] = useState("");

  const [usernameError, setUsernameError] = useState(false);
  const [usernameHelperText, setUsernameHelperText] = useState("");

  const [emailError, setEmailError] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState("");

  const [passwordError, setPasswordError] = useState(false);
  const [passwordHelperText, setPasswordHelperText] = useState("");

  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordHelperText, setConfirmPasswordHelperText] =
    useState("");

  const getStrength = (password: string) => {
    let indicator = -1;

    if (/[a-z]/.test(password)) {
      indicator++;
    }
    if (/[A-Z]/.test(password)) {
      indicator++;
    }
    if (/\d/.test(password)) {
      indicator++;
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
      indicator++;
    }
    if (password.length >= 16) {
      indicator++;
    }

    return passwordStrengthLables[indicator];
  };

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);

    if (!/^[a-zA-Z ]+$/.test(e.target.value)) {
      setUsernameError(true);
      setUsernameHelperText(authUsernameInvalid);
    } else if (e.target.value.length < 5) {
      setUsernameError(true);
      setUsernameHelperText(authUsernameShort);
    } else if (e.target.value.length > 35) {
      setUsernameError(true);
      setUsernameHelperText(authUsernameLong);
    } else {
      setUsernameError(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    console.log(e.target.value);

    if (
      !/^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/.test(e.target.value)
    ) {
      setEmailError(true);
      setEmailHelperText(emailInvalid);
    } else {
      setEmailError(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordStrength(getStrength(e.target.value));
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    if (e.target.validity.valid) {
      setConfirmPasswordError(false);
    } else {
      setConfirmPasswordError(true);
    }
  };

  const handleSubmit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    if (event.target.checkValidity()) {
      alert("Form is valid! Submitting the form...");
    } else {
      alert("Form is invalid! Please check the fields...");
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      className={style.wrapper}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          maxWidth: "1080px",
          height: "800px",
          backgroundColor: "white",
          borderRadius: "48px",
          boxShadow: "0px 0px 50px 5px rgba(255, 255, 255, 0.5)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
            width: "540px",
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <h1 className={style.formTitle}>Sign up</h1>
            <Box
              sx={{ width: "100%", padding: "20px", marginTop: "50px" }}
              className={style.formFields}
            >
              {/* Username form control */}
              <Box sx={{ width: "100%", marginBottom: "20px" }}>
                <FormControl
                  className={style.formControl}
                  sx={{ width: "100%" }}
                >
                  <InputLabel required={true}>Username</InputLabel>
                  <Input
                    id="user"
                    autoFocus={true}
                    type="text"
                    required={true}
                    onChange={handleUserNameChange}
                    value={usernameValue}
                    error={usernameError}
                  />
                  <FormHelperText id="username-helper" error={usernameError}>
                    {usernameError ? usernameHelperText : ""}
                  </FormHelperText>
                </FormControl>
              </Box>
              {/* Email form control */}
              <Box sx={{ width: "100%", marginBottom: "20px" }}>
                <FormControl sx={{ width: "100%" }}>
                  <InputLabel required={true}>Email address</InputLabel>
                  <Input
                    id="email"
                    type="email"
                    required={true}
                    onChange={handleEmailChange}
                    value={emailValue}
                    error={emailError}
                  />
                  <FormHelperText id="email-helper" error={emailError}>
                    {emailError ? emailHelperText : ""}
                  </FormHelperText>
                </FormControl>
              </Box>
              {/* Password form control */}
              <Box sx={{ width: "100%", marginBottom: "20px" }}>
                <FormControl sx={{ width: "100%" }}>
                  <InputLabel required={true}>Password</InputLabel>
                  <Input
                    id="password"
                    type="password"
                    required={true}
                    onChange={handlePasswordChange}
                    value={passwordValue}
                    error={passwordError}
                  />
                  <FormHelperText id="password-helper" error={passwordError}>
                    {/* {helperText} */} Helper text
                  </FormHelperText>
                </FormControl>
              </Box>
              {/* Confirm password form control */}
              <Box sx={{ width: "100%", marginBottom: "20px" }}>
                <FormControl required={true} sx={{ width: "100%" }}>
                  <InputLabel>Confirm password</InputLabel>
                  <Input
                    id="conform-password"
                    type="password"
                    required={true}
                    onChange={handleConfirmPasswordChange}
                    value={confirmPasswordValue}
                    error={confirmPasswordError}
                  />
                  <FormHelperText
                    id="confirm-password-helper"
                    error={confirmPasswordError}
                  >
                    {/* {helperText} */} Helper text
                  </FormHelperText>
                </FormControl>
              </Box>
              <div className={`${style.bars} ${style[passwordStrength]}`}>
                <div></div>
              </div>
              <div className={style.strength}>
                {passwordStrength && `${passwordStrength} password`}
              </div>
            </Box>
            <div className={style.formFooter}>
              <button className={style.submitBtn} type="submit">
                Sign up
              </button>
              <div className={style.formFooterNavigation}>
                <div className={style.formNavigation}>
                  <p className={style.questionTag}>Already have an account?</p>
                  <Link className={style.link} to={SIGNIN_ROUTE}>
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default AuthPage;
