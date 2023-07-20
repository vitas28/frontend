import * as yup from 'yup';

const formikSchema = {
  initialValues: {
    email: '',
    password: '',
  },
  validationSchema: yup.object({
    email: yup
      .string()
      .email('Please Enter a Valid Email')
      .required('Email Missing'),
    password: yup.string().required('Password Missing'),
  }),
};

const formikSchemaForVerify = {
  initialValues: {
    password: '',
  },
  validationSchema: yup.object({
    password: yup.string().required('Password Missing'),
  }),
};

export { formikSchema, formikSchemaForVerify };
