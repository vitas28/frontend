import {
  formatNumber,
  FullPageLoad,
  generateLinkWithParams,
  GridContainer,
  Link,
  linkPlaceholders,
  navLinks,
  PageContainer,
  routing,
  RowFlex,
  TableView,
  TopBar,
  useAxios,
} from "common";
import { useThemeFlip } from "containers";
import { KPI, Loan } from "modules";
import React from "react";
import { useParams } from "react-router-dom";

const ViewLoan = () => {
  const { loanId } = useParams();
  useThemeFlip();
  const { response, refetch } = useAxios({
    callOnLoad: {
      method: "GET",
      url: `/loans/${loanId}`,
      params: { populate: "payments deposits" },
    },
  });
  if (response) {
    const linkParams = { [linkPlaceholders.loanId]: loanId };
    const loan = new Loan(response.data);
    const { status } = loan.getPaymentStatus();
    const adminProps = {
      deleteUrl: (id) => `/loanPayments/${id}`,
      deleteMessage: () => `Delete Payment`,
      ...(status === "Paid"
        ? {}
        : {
            actionLink: generateLinkWithParams(
              routing.loanPayments.add + `?loan=${loan.id}`,
              linkParams
            ),
            actionName: "Add Payment",
          }),
    };
    const gridConfig = [
      {
        name: "date",
        header: "Date",
        isDate: true,
      },
      {
        name: "SO",
        header: "SO",
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
    const filterConfig = [
      {
        name: "SO",
        type: "input",
        label: "SO",
      },
    ];
    return (
      <PageContainer style={{ gridTemplateRows: "auto auto auto auto 1fr" }}>
        <TopBar>
          <RowFlex>
            <h1>Loan {loan.paymentNumber}</h1>
            {loan.getStatusPill()}
          </RowFlex>
          <Link to={generateLinkWithParams(routing.loans.edit, linkParams)}>
            Edit
          </Link>
        </TopBar>
        <GridContainer columns={5}>
          <KPI flipped kpi={loan.PO} description="PO" />
          {loan.brand && <KPI flipped kpi={loan.brand} description="Brand" />}
          <KPI flipped kpi={loan.loanNumber} description="Loan Number" />
          <KPI
            flipped
            kpi={new Date(loan.date).toLocaleDateString()}
            description="Date"
          />
          <KPI
            flipped
            kpi={`$${formatNumber(loan.amountDrawn)}`}
            description="Loan Amount"
          />
          <KPI
            flipped
            kpi={`$${formatNumber(loan.amountSecuredBySOs)}`}
            description="Amount Secured By SO's"
          />
          <KPI
            flipped
            kpi={`$${formatNumber(loan.getTotalPaid())}`}
            description="Total Repaid"
          />
          <KPI
            flipped
            kpi={`$${formatNumber(loan.getAvailable())}`}
            description="Open Balance"
          />
        </GridContainer>
        <TableView
          darker
          url="/loanPayments"
          defaultParams={{ filters: { loan: loan.id } }}
          tableConfig={[
            {
              name: "paymentNumber",
              header: "#",
            },
            ...gridConfig,
          ]}
          gridConfig={gridConfig}
          navLinks={navLinks.loanPayments}
          linkParam={linkPlaceholders.loanPaymentId}
          header="Payments"
          filterConfig={filterConfig}
          selectView
          gridHeadingFunction={(item) => item.paymentNumber}
          {...adminProps}
          onActionComplete={() => {
            refetch();
          }}
          searchParams={`?loan=${loan.id}`}
        />
      </PageContainer>
    );
  }
  return <FullPageLoad fillWidth />;
};

export default ViewLoan;
