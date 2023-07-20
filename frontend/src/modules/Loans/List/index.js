import {
  Button,
  generateLinkWithParams,
  linkPlaceholders,
  navLinks,
  routing,
  TableView,
} from "common";
import { useThemeFlip } from "containers";
import { useTotalAvailable } from "modules/LoanLandingPage";
import React from "react";
import { Link } from "react-router-dom";
import { Loan } from "../utils";

const LoanList = () => {
  const { refetchLoanAmounts } = useTotalAvailable();
  useThemeFlip();
  const adminProps = {
    deleteUrl: (id) => `/loans/${id}`,
    deleteMessage: () => `Delete Loan`,
    actionLink: routing.loans.add,
    actionName: "Add Loan",
    additionalActions: [
      <Link key="bulkadd" to={routing.loans.bulkAdd}>
        <Button>Bulk Add</Button>
      </Link>,
    ],
  };
  const gridConfig = [
    {
      name: "PO",
      header: "PO",
    },
    {
      name: "brand",
      header: "Brand",
    },
    {
      name: "billTotal",
      header: "Bill Total",
      isCurrency: true,
    },
    {
      name: "amountDrawn",
      header: "Amount",
      isCurrency: true,
    },
    {
      name: "available",
      header: "Amount Still Open",
      isCurrency: true,
    },
    {
      name: "totalPaid",
      header: "Total Paid",
      isCurrency: true,
    },
    {
      name: "amountSecuredBySOs",
      header: "Secured By SOs",
      isCurrency: true,
    },
    {
      name: "addPayment",
      header: "",
      noTo: true,
      sortable: false,
      width: 150,
    },
  ];
  return (
    <TableView
      dataGrid
      darker
      to={routing.loans.view}
      url="/loans"
      tableConfig={[
        {
          name: "loanNumber",
          header: "#",
          width: 50,
        },
        {
          name: "date",
          header: "Date",
        },
        {
          name: "status",
          header: "Status",
          render: (row) => new Loan(row).getStatusPill(),
          width: 150,
        },
        ...gridConfig,
      ]}
      gridConfig={gridConfig}
      shapeData={(r) =>
        r.data.data.map((d) => {
          const loan = new Loan(d);
          const isPaid = loan.getPaymentStatus().status === "Paid";
          return {
            ...d,
            status: loan.getPaymentStatus().status,
            date: new Date(loan.date).toLocaleDateString(),
            available: loan.getAvailable(),
            totalPaid: loan.amountDrawn - loan.getAvailable(),
            addPayment: (
              <Link
                to={generateLinkWithParams(
                  routing.loanPayments.add + `?loan=${loan.id}`,
                  {
                    [linkPlaceholders.loanId]: loan.id,
                  }
                )}
              >
                <Button disabled={isPaid}>
                  {isPaid ? "Paid" : "Add Payment"}
                </Button>
              </Link>
            ),
          };
        })
      }
      navLinks={navLinks.loans}
      linkParam={linkPlaceholders.loanId}
      header="Loans"
      selectView
      defaultParams={{ populate: "payments deposits" }}
      gridHeadingFunction={(item) => item.loanNumber}
      gridHeaderComponentFunction={(i) => new Loan(i).getStatusPill()}
      onActionComplete={refetchLoanAmounts}
      {...adminProps}
    />
  );
};

export default LoanList;
