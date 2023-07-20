import { RowFlex } from "common/styles";
import { Field, Form, Formik, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import Dropdown from "../Dropdown";
import TextField from "../TextField";

const removeNullsFromObject = (filterConfig = [], obj = {}) => {
  return filterConfig.reduce((acc, { name: key, type }) => {
    const value = obj[key];
    if (value) {
      const isInput = type === "input";
      const filterObject = isInput
        ? {
            $regex: value,
            $options: "i",
          }
        : value;

      const baseSearch = { [key]: filterObject };

      const thisPayload = isInput
        ? { $or: [baseSearch, { [`${key}NoSpaces`]: filterObject }] }
        : baseSearch;
      if (acc) {
        return { ...acc, ...thisPayload };
      }
      return thisPayload;
    }
    return acc;
  }, undefined);
};

const Filters = ({ filterConfig = [], setFilters = () => {} }) => {
  const initialValues = filterConfig.reduce(
    (acc, { name, type }) => ({ ...acc, [name]: type === "input" ? "" : null }),
    {}
  );
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => {
        setFilters(removeNullsFromObject(filterConfig, values));
      }}
    >
      <FormPart filterConfig={filterConfig} />
    </Formik>
  );
};

const FormPart = ({ filterConfig = [] }) => {
  const { submitForm, values } = useFormikContext();
  useEffect(() => {
    const searchme = setTimeout(submitForm, 500);
    return () => {
      clearTimeout(searchme);
    };
  }, [values, submitForm]);
  return (
    <Form>
      <RowFlex responsive>
        {filterConfig.map(({ name, type, ...rest }) => {
          const Component = type === "input" ? TextField : Dropdown;
          return (
            <Field
              key={name}
              component={Component}
              name={name}
              {...rest}
              isClearable
            />
          );
        })}
      </RowFlex>
    </Form>
  );
};

const useFilters = ({ filterConfig = [], recallFunction = () => {} }) => {
  const [filters, setFilters] = useState();

  useEffect(() => {
    recallFunction({ filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const filtersComponent = (
    <Filters filterConfig={filterConfig} setFilters={setFilters} />
  );
  return { filters, filtersComponent };
};

export default useFilters;
