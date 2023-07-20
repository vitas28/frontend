import {
  Attachments,
  brandRequestStatusObject,
  Card,
  CollapsibleHeader,
  FullPageLoad,
  generateLinkWithParams,
  getSourcingStatusList,
  Link,
  linkPlaceholders,
  Notes,
  routing,
  RowFlex,
  Table,
  TableView,
  theme,
  TopBar,
  useAxios,
  useLoginContext,
} from "common";
import { useToast } from "common/context/Toast";
import { format } from "date-fns";
import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import { useParams } from "react-router-dom";
import BulkStatusChange from "./BulkStatusChange";
import EmailVendor from "./EmailVendor";
import {
  BrandRequestDetails,
  Container,
  DividerLine,
  KPIContainer,
  Splitter,
} from "./styles";
import VendorAddForm from "./VendorAddForm";

const KPI = ({ kpi, description, flipped, large }) => {
  const kpiElement = large ? <h2>{kpi}</h2> : <h4>{kpi}</h4>;
  const descriptionElement = <p>{description}</p>;
  return (
    <KPIContainer>
      {flipped ? descriptionElement : kpiElement}
      {flipped ? kpiElement : descriptionElement}
    </KPIContainer>
  );
};

const ViewBrandRequest = () => {
  const { brandRequestId } = useParams();
  const [showChildBrands, setShowChildBrands] = useState(false);
  const alertSuccessMessage = "Brand Request Updated";
  const url = `/brandrequests/${brandRequestId}`;
  const { response, refetch } = useAxios({
    callOnLoad: {
      clearResponse: false,
      method: "GET",
      url,
      params: {
        populate:
          "user category vendorRequests parentBrandRequest childBrandRequests",
      },
    },
  });
  const { callAxios, loading } = useAxios({
    alertSuccess: alertSuccessMessage,
    onComplete: refetch,
  });
  const { alertSuccess } = useToast();
  const { isSourcingAdmin } = useLoginContext();

  const adminProps = isSourcingAdmin
    ? {
        actionModal: true,
        ActionComponent: VendorAddForm,
        actionComponentProps: { brandRequestId },
        actionName: "Add Vendors",
        onActionComplete: refetch,
        deleteUrl: (vrId) => `vendorRequests/${vrId}`,
      }
    : {};

  if (!response) return <FullPageLoad fillWidth />;

  const { data: brandRequest } = response;
  return (
    <Container>
      <TopBar>
        <h1>Brand Details</h1>
        {isSourcingAdmin && (
          <Link
            to={generateLinkWithParams(routing.brandRequests.edit, {
              [linkPlaceholders.brandRequestId]: brandRequestId,
            })}
          >
            Edit
          </Link>
        )}
      </TopBar>
      <BrandRequestDetails>
        <div>
          <h3>{brandRequest.brandName}</h3>
          {brandRequest.parentBrandRequest && (
            <RowFlex>
              <h4>Parent:</h4>
              <h4>
                <Link
                  to={generateLinkWithParams(routing.brandRequests.view, {
                    [linkPlaceholders.brandRequestId]:
                      brandRequest.parentBrandRequest.id,
                  })}
                >
                  {brandRequest.parentBrandRequest.brandName}
                </Link>
              </h4>
            </RowFlex>
          )}
          {brandRequest.brandEmail && <h4>{brandRequest.brandEmail}</h4>}
          {brandRequest.url && (
            <a
              style={{ color: theme.colors.primary, fontWeight: "bold" }}
              href={brandRequest.url}
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
          )}
        </div>
        <DividerLine />
        <KPI kpi={brandRequest.category?.name} description="Category" />
        <KPI
          kpi={brandRequest.requestedByCustomer}
          description="Requested By Customer"
        />
        <KPI
          kpi={brandRequest.user.name}
          description="Requested By Sales Rep"
        />
        <KPI
          kpi={format(new Date(brandRequest.createdAt), "MMMM dd, yyyy")}
          description="Requested Date"
        />
        <KPI
          kpi={brandRequest.statuses
            .map((s) => brandRequestStatusObject[s].label)
            .join(", ")}
          description="Statuses"
        />
      </BrandRequestDetails>
      {brandRequest.childBrandRequests.length > 0 && (
        <CollapsibleHeader
          header="Child Brand Requests"
          show={showChildBrands}
          setShow={setShowChildBrands}
        />
      )}
      {showChildBrands && (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {brandRequest.childBrandRequests.map((br) => {
                return (
                  <tr key={br.id}>
                    <td>{br.brandName}</td>
                    <td>{brandRequestStatusObject[br.status]?.label}</td>
                    <td>
                      <Link
                        to={generateLinkWithParams(routing.brandRequests.view, {
                          [linkPlaceholders.brandRequestId]: br.id,
                        })}
                      >
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
      <Card>
        <TableView
          filterConfig={[
            {
              name: "status",
              type: "dropdown",
              label: "Status",
              options: getSourcingStatusList(),
            },
          ]}
          bulkActions={[{ name: "Change Status", Component: BulkStatusChange }]}
          darker
          url="/vendorRequests"
          tableConfig={[
            {
              name: "name",
              header: "Vendor Name",
            },
            {
              name: "country",
              header: "Country",
            },
            {
              name: "joinedDate",
              header: "Requested Date",
              isDate: true,
            },
            {
              name: "status",
              header: "Status",
              isDropdown: isSourcingAdmin,
              options: getSourcingStatusList(),
              onChange: (row, status, reloadTable) => {
                callAxios({
                  method: "PUT",
                  url: `/vendorRequests/${row.id}`,
                  data: { status },
                }).then(() => {
                  alertSuccess(alertSuccessMessage);
                  refetch();
                  reloadTable();
                });
              },
              loading,
            },
            {
              name: "email",
              header: "",
              type: "modal",
              icon: "email",
              Component: EmailVendor,
              componentProps: {
                title: brandRequest.brandName,
                body: brandRequest.brandEmail
                  ? `<p>Email: ${brandRequest.brandEmail}</p>`
                  : "",
              },
            },
          ]}
          linkParam={linkPlaceholders.brandRequestId}
          height="45vh"
          header="Vendors"
          {...adminProps}
          defaultParams={{
            populate: "vendorData",
          }}
          defaultFilters={{ brandRequest: brandRequestId }}
          shapeData={(res) =>
            res.data.data.map((d) => ({
              ...d,
              name: (
                <Link
                  to={generateLinkWithParams(routing.vendors.view, {
                    [linkPlaceholders.vendorId]: d.vendorData.id,
                  })}
                >
                  {d.vendorData.name}
                </Link>
              ),
              country: d.vendorData.country,
              joinedDate: d.vendorData.createdAt,
            }))
          }
        />
      </Card>
      <Splitter>
        <Notes
          notes={brandRequest.notes}
          onComplete={refetch}
          alertSuccess={alertSuccessMessage}
          url={url}
        />
        <Attachments
          url={url}
          attachments={brandRequest.attachments}
          onComplete={refetch}
        />
      </Splitter>
    </Container>
  );
};

export { ViewBrandRequest, KPI };
