import {
  FormikSubmit,
  FormWrapper,
  isKanda,
  Logo,
  TextField,
  useAxios,
  useToast,
} from "common";
import { Field, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formikSchema, formikSchemaForVerify } from "./formikSchema";
import { Container, LoginBox, LogoSection } from "./styles";

const Login = ({ fetchUser }) => {
  const navigate = useNavigate();
  const loadRecaptcha = () => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.REACT_APP_CAPTCHA_SITE_KEY}`;
    script.id = "recaptcha-script";
    document.body.append(script);
  };

  const removeRecaptcha = () => {
    const script = document.getElementById("recaptcha-script");
    if (script) {
      script.remove();
    }
    const recaptchaElems = document.getElementsByClassName("grecaptcha-badge");
    if (recaptchaElems.length) {
      recaptchaElems[0].remove();
    }
  };

  useEffect(() => {
    if (process.env.REACT_APP_CAPTCHA_SITE_KEY) {
      loadRecaptcha();
    }
    return removeRecaptcha;
  }, []);

  const [mustVerify, setMustVerify] = useState();
  const { callAxios, loading } = useAxios();
  const { onError } = useToast();
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const login = (data) => {
    callAxios({
      url: "/auth/login",
      method: "POST",
      data,
      withCredentials: true,
    })
      .then((res) => {
        if (res) {
          if (
            (!isKanda() && data.password === "Work987") ||
            (isKanda() && data.password === "kanda") ||
            (res.data.vendor && data.password === "vendoruser")
          ) {
            setMustVerify(res.data);
          } else {
            setUserId(res.data._id);
            setTwoFactorModal(true);
          }
        }
      })
      .catch(onError);
  };

  const onFormSubmit = (data) => {
    if (twoFactorModal) {
      const body = {
        code: data.code,
        userId,
      };
      callAxios({
        url: "/auth/verify",
        method: "POST",
        data: body,
        withCredentials: true,
      }).then(() => {
        fetchUser();
      });
      navigate("/home");
    } else if (window.grecaptcha) {
      window.grecaptcha.ready(function () {
        window.grecaptcha
          .execute(process.env.REACT_APP_CAPTCHA_SITE_KEY, {
            action: "submit",
          })
          .then(function (token) {
            data.token = token;
            login(data);
          });
      });
    } else {
      login(data);
    }
  };

  return (
    <Container>
      <LoginBox>
        <LogoSection>
          <Logo />
        </LogoSection>
        {!mustVerify ? (
          <Formik {...formikSchema} onSubmit={(data) => onFormSubmit(data)}>
            <FormWrapper alignCenter style={{ padding: "1rem" }}>
              <Form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {twoFactorModal ? (
                  <>
                    <h3>Code</h3>
                    <Field
                      name="code"
                      component={TextField}
                      label="Code"
                      required
                      fillWidth
                    />
                  </>
                ) : (
                  <>
                    <h3>Login</h3>
                    <Field
                      name="email"
                      component={TextField}
                      label="Email"
                      required
                      fillWidth
                    />
                    <Field
                      name="password"
                      component={TextField}
                      label="Password"
                      required
                      type="password"
                      fillWidth
                    />
                  </>
                )}
              </Form>
              <FormikSubmit loading={loading}>
                {twoFactorModal ? "Send Code" : "Login"}
              </FormikSubmit>
            </FormWrapper>
          </Formik>
        ) : (
          <Formik
            {...formikSchemaForVerify}
            onSubmit={(data) => {
              callAxios({
                url: "/auth/password",
                method: "PUT",
                data,
                withCredentials: true,
              }).then((res) => {
                if (res) {
                  fetchUser();
                }
              });
            }}
          >
            <FormWrapper alignCenter style={{ padding: "1rem" }}>
              <Form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h3>Update Password</h3>
                <Field
                  name="password"
                  component={TextField}
                  label="Password"
                  required
                  type="password"
                  fillWidth
                />
              </Form>
              <FormikSubmit loading={loading}>Login</FormikSubmit>
            </FormWrapper>
          </Formik>
        )}
      </LoginBox>
    </Container>
  );
};

export default Login;
