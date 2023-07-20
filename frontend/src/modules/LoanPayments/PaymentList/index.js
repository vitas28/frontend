import { linkPlaceholders, navLinks, routing, TableView } from "common";
import { useThemeFlip } from "containers";
import { LinkToLoan, useTotalAvailable } from "modules";
import React from "react";
import Total from "./Total";

const PaymentList = () => {
  useThemeFlip();
  const { refetchLoanAmounts } = useTotalAvailable();
  const adminProps = {
    deleteUrl: (id) => `/loanPayments/${id}`,
    deleteMessage: () => `Delete Payment`,
    actionLink: routing.loanPayments.add,
    actionName: "Add Payment",
  };
  const gridConfig = [
    {
      name: "loan",
      header: "Loan",
    },
    {
      name: "date",
      header: "Date",
      isDate: true,
    },
    {
      name: "SO",
      header: "SO",
      width: 150,
    },
    {
      name: "amount",
      header: "Amount",
      isCurrency: true,
    },
    {
      name: "paid",
      header: "Paid",
    },
  ];
  return (
    <TableView
      dataGrid
      darker
      url="/loanPayments"
      tableConfig={[
        {
          name: "paymentNumber",
          header: "#",
        },
        ...gridConfig,
      ]}
      gridConfig={gridConfig}
      shapeData={(r) =>
        r.data.data.map((l) => ({
          ...l,
          loan: <LinkToLoan loan={l.loan} />,
          paid: !!l.paid,
        }))
      }
      navLinks={navLinks.loanPayments}
      defaultParams={{ populate: "loan" }}
      linkParam={linkPlaceholders.loanPaymentId}
      header="Payments"
      selectView
      gridHeadingFunction={(item) => item.paymentNumber}
      {...adminProps}
      HeaderComponent={Total}
      onActionComplete={refetchLoanAmounts}
    />
  );
};

export default PaymentList;
