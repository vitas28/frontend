import {
  Attachments,
  Button,
  Card,
  DropdownButton,
  FullPageLoad,
  generateLinkWithParams,
  getApiPath,
  getSourcingStatusList,
  Link,
  linkPlaceholders,
  Notes,
  openNewTab,
  routing,
  RowFlex,
  TableView,
  useAxios,
  useBrandRequests,
} from "common";
import BulkStatusChange from "modules/BrandRequests/ViewBrandRequest/BulkStatusChange";
import EmailVendor from "modules/BrandRequests/ViewBrandRequest/EmailVendor";
import React from "react";
import { useParams } from "react-router-dom";
import BrandRequestAddForm from "./BrandRequestAddForm";
import EmailContact from "./EmailContact";
import { Container, KPIContainer, Splitter, VendorDetails } from "./styles";

const KPI = ({ kpi, description }) => (
  <KPIContainer>
    <h4>{kpi}</h4>
    <p>{description}</p>
  </KPIContainer>
);

const ViewVendor = () => {
  const { vendorId } = useParams();
  const alertSuccess = "Vendor Updated";
  const url = `/vendors/${vendorId}`;
  const { brandRequests } = useBrandRequests();
  const { response, refetch } = useAxios({
    callOnLoad: {
      clearResponse: false,
      method: "GET",
      url,
      params: { populate: "vendorRequests contacts users" },
    },
  });

  const { callAxios, loading } = useAxios({
    alertSuccess,
    onComplete: refetch,
  });
  if (!response) return <FullPageLoad fillWidth />;

  const { data: vendor } = response;
  return (
    <Container>
      <h1>Vendor Details</h1>
      <VendorDetails>
        <h3>{vendor.name}</h3>
        <KPI kpi={vendor.country} description="Country" />
        <KPI kpi={vendor.vendorRequests.length} description="Brand Requests" />
        <KPI kpi="Active" description="Status" />
      </VendorDetails>
      <Card>
        <TableView
          darker
          url="/vendorRequests"
          filterConfig={[
            {
              name: "brandRequest",
              type: "dropdown",
              label: "Brand",
              options: brandRequests,
            },
            {
              name: "status",
              type: "dropdown",
              label: "Status",
              options: getSourcingStatusList(),
            },
          ]}
          tableConfig={[
            {
              name: "name",
              header: "Brand Name",
            },
            {
              name: "category",
              header: "Category",
            },
            {
              name: "createdAt",
              header: "Created",
              isDate: true,
            },
            {
              name: "status",
              header: "Status",
              isDropdown: true,
              options: getSourcingStatusList(),
              onChange: (row, status, reloadTable) => {
                callAxios({
                  method: "PUT",
                  url: `/vendorRequests/${row.id}`,
                  data: { status },
                }).then(() => {
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
              componentProps: (row) => ({
                title: row.brandName,
                body: row.brandEmail ? `<p>Email: ${row.brandEmail}</p>` : "",
              }),
            },
          ]}
          linkParam={linkPlaceholders.brandRequestId}
          height="45vh"
          header="Requested Brands"
          actionModal
          ActionComponent={BrandRequestAddForm}
          actionComponentProps={{
            vendor: vendorId,
            contacts: vendor.contacts,
          }}
          onActionComplete={refetch}
          actionName="Add New Brand Request"
          additionalActions={[
            <div key="1">
              <DropdownButton
                secondary
                options={[
                  <div
                    key="1.1"
                    onMouseDown={() =>
                      openNewTab(
                        getApiPath(`vendors/${vendorId}/brands/export`)
                      )
                    }
                  >
                    All
                  </div>,
                  <div
                    key="2"
                    onMouseDown={() =>
                      openNewTab(
                        getApiPath(
                          `vendors/${vendorId}/brands/export?status=AllWorkedOn`
                        )
                      )
                    }
                  >
                    Working On
                  </div>,
                ]}
              >
                Export
              </DropdownButton>
            </div>,
          ]}
          bulkActions={[
            {
              name: "Export Selected",
              Component: ({ ids, close }) => (
                <div>
                  <h3 style={{ marginBottom: "1rem" }}>
                    Export {ids.length} Requests
                  </h3>
                  <Button
                    onClick={() => {
                      close();
                      openNewTab(
                        getApiPath(
                          `vendors/${vendorId}/brands/export?ids=${ids}`
                        )
                      );
                    }}
                  >
                    Proceed
                  </Button>
                </div>
              ),
            },
            {
              name: "Email Contacts",
              Component: EmailContact,
              componentProps: {
                contacts: vendor.contacts,
                vendor: vendor.id,
              },
            },
            { name: "Change Status", Component: BulkStatusChange },
          ]}
          deleteUrl={(vrId) => `vendorRequests/${vrId}`}
          defaultFilters={{ vendor: vendorId }}
          defaultParams={{
            populate: { path: "brandRequest", populate: "category" },
          }}
          shapeData={(res) =>
            res.data.data
              .filter((d) => d.brandRequest)
              .map((d) => ({
                ...d.brandRequest,
                ...d,
                name: (
                  <Link
                    to={generateLinkWithParams(routing.brandRequests.view, {
                      [linkPlaceholders.brandRequestId]: d.brandRequest?.id,
                    })}
                  >
                    {d.brandRequest.brandName}
                  </Link>
                ),
                category: d.brandRequest.category?.name,
              }))
          }
        />
      </Card>
      <Card>
        <RowFlex extend>
          <h3>Users ({vendor.users?.length || 0})</h3>
          <Link
            to={generateLinkWithParams(routing.vendors.addUser, {
              [linkPlaceholders.vendorId]: vendor.id,
            })}
          >
            <Button>Add User</Button>
          </Link>
        </RowFlex>
        {vendor.users?.map((user) => (
          <RowFlex key={user.id}>
            <div>{user.name}</div>({user.email})
          </RowFlex>
        ))}
      </Card>
      <Splitter>
        <Notes
          url={url}
          onComplete={refetch}
          notes={vendor.notes}
          alertSuccess={alertSuccess}
        />
        <Attachments
          url={url}
          attachments={vendor.attachments}
          onComplete={refetch}
        />
      </Splitter>
    </Container>
  );
};

export default ViewVendor;
