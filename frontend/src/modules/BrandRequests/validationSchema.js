import * as yup from "yup";

const validationSchema = yup.object({
  brandName: yup.string().required(),
  notes: yup.string().nullable(),
  brandEmail: yup.string().email().nullable(),
  requestBy: yup.string().required(),
  category: yup.string(),
  requestedByCustomer: yup.string(),
  url: yup.string().nullable(),
});

export default validationSchema;
