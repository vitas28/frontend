import {
  Dropdown,
  FormikSubmit,
  FormWrapper,
  getSourcingStatusList,
  useAxios,
  useToast,
} from "common";
import { Field, Form, Formik } from "formik";
import React, { useState } from "react";
import * as yup from "yup";

const formikSchema = {
  initialValues: {
    status: "",
  },
  validationSchema: yup.object({
    status: yup.string().required(),
  }),
};

const StatusChangeForm = ({
  close,
  ids = [],
  reloadTable,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const { alertSuccess, onError } = useToast();

  const { callAxios } = useAxios({});

  const mutate = async (data) => {
    for (const id of ids) {
      await callAxios({
        method: "PUT",
        url: `/brandRequests/${id}/changeStatus`,
        data,
      });
    }
  };

  return (
    <div>
      <h3>Change Status</h3>
      <Formik
        {...formikSchema}
        onSubmit={(values) => {
          setLoading(true);
          mutate(values)
            .then(() => {
              alertSuccess("Brand Requests Updated Successfully.");
              close();
              reloadTable();
              onActionComplete();
            })
            .catch(onError)
            .finally(() => setLoading(false));
        }}
      >
        <FormWrapper>
          <Form>
            <Field
              component={Dropdown}
              options={getSourcingStatusList()}
              label="Status"
              required
              name="status"
            />
          </Form>
          <FormikSubmit loading={loading}>Submit</FormikSubmit>
        </FormWrapper>
      </Formik>
    </div>
  );
};

export default StatusChangeForm;
