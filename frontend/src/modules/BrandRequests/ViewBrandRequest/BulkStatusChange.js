import {
  Dropdown,
  FormikSubmit,
  FormWrapper,
  getSourcingStatusList,
  useAxios,
} from "common";
import { useToast } from "common/context/Toast";
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

const BulkStatusChange = ({
  close,
  ids = [],
  onActionComplete,
  reloadTable,
}) => {
  const [loading, setLoading] = useState(false);
  const { onError, alertSuccess } = useToast();
  const { callAxios } = useAxios();

  const changeStatuses = async (status) => {
    for (const id of ids) {
      await callAxios({
        method: "PUT",
        url: `/vendorRequests/${id}`,
        data: { status },
      });
    }
  };

  return (
    <div>
      <h3>Change Status for {ids.length} Requests</h3>
      <Formik
        {...formikSchema}
        onSubmit={(values) => {
          setLoading(true);
          changeStatuses(values.status)
            .then(() => {
              alertSuccess("Statuses Changed Successfully");
              close();
              onActionComplete();
              reloadTable();
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

export default BulkStatusChange;
