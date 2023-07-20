import { emailSchemaObject, isMissing } from "common";
import * as yup from "yup";

const margin = (minMargin = 0, role) => {
  if (role === "Admin") {
    return yup.number().nullable();
  } else {
    return yup
      .number()
      .min(
        minMargin,
        minMargin > 0
          ? `Margin must be Above Brands minimum margin of ${minMargin}%`
          : "Margin Cannot be Negative"
      )
      .max(99.9999999, "Margin Cannot be 100% or more")
      .nullable();
  }
};

const MSRPDiscount = yup
  .number(isMissing("MSRP Discount"))
  .min(0, "Discount Cannot be Negative")
  .max(100, "Discount Cannot be over 100%")
  .nullable();

const formikSchema = (brand, role) => ({
  initialValues: {
    margin: null,
    MSRPDiscount: null,
    fromCurrency: brand.currency.code,
    toCurrency: brand.currency.code,
  },
  validationSchema: yup.object({
    margin: margin(brand.minimumMargin || 0, role),
    MSRPDiscount,
  }),
});

const formikSchemaForEmail = (brand, userRole) => ({
  initialValues: {
    to: [],
    subject: "",
    html: "",
    cc: [],
    bcc: [],
    margin: null,
    MSRPDiscount: null,
    fromCurrency: brand.currency.code,
    toCurrency: brand.currency.code,
  },
  validationSchema: yup.object({
    margin: margin(brand.minimumMargin || 0, userRole),
    MSRPDiscount,
    ...emailSchemaObject,
  }),
});

export { formikSchema, formikSchemaForEmail };
