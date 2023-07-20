import { View } from "@carbon/icons-react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  brandRequestStatusObject,
  Button,
  generateLinkWithParams,
  isRequestOpen,
  Link,
  linkPlaceholders,
  PageContainer,
  routing,
  RowFlex,
  Spinner,
  useAxios,
  useModalContext,
} from "common";
import { orderBy } from "lodash";
import { useVendorUserVendor } from "modules/VendorUserLandingPage";
import React from "react";
import StatusChangeModal from "../StatusChangeModal";

const BrandList = () => {
  const { vendor, refetchVendor, vendorLoading } = useVendorUserVendor();
  const brands = vendor.vendorRequests;
  const { callAxios, loading } = useAxios({
    onComplete: () => refetchVendor(),
  });
  const { setModalContent, closeModal } = useModalContext();
  const getTo = (vendorRequestId) =>
    generateLinkWithParams(routing.vendorUsers.viewBrand, {
      [linkPlaceholders.vendorRequestId]: vendorRequestId,
    });
  return (
    <PageContainer>
      <RowFlex>
        <h3>New Brands for {vendor.name}</h3>
        {vendorLoading && <Spinner inline />}
      </RowFlex>
      <DataGrid
        autoHeight
        rowSelection={false}
        slots={{ toolbar: GridToolbar }}
        columns={[
          {
            field: "brandName",
            headerName: "Brand",
            description: "Brand",
            hideable: false,
            width: 150,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>{value}</Link>
            ),
          },
          {
            field: "createdAt",
            headerName: "Requested Date",
            description: "Date of Request",
            hideable: false,
            width: 200,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>{value}</Link>
            ),
          },
          {
            field: "status",
            headerName: "Status",
            hideable: false,
            width: 200,
            renderCell: ({ value, row }) => (
              <Button
                loading={loading}
                onClick={() => {
                  setModalContent(
                    <StatusChangeModal
                      status={value}
                      onSubmit={(status) => {
                        closeModal();
                        callAxios({
                          method: "PUT",
                          url: `vendorRequests/${row.id}`,
                          data: { status },
                        });
                      }}
                    />
                  );
                }}
              >
                {brandRequestStatusObject[value]?.label}
              </Button>
            ),
          },
          {
            field: "category",
            headerName: "Category",
            description: "Category",
            hideable: false,
            width: 150,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>{value}</Link>
            ),
          },
          {
            field: "updatedAt",
            headerName: "Last Modified",
            description: "Last Modified",
            hideable: false,
            width: 150,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>{value}</Link>
            ),
          },
          {
            field: "view",
            headerName: "",
            description: "",
            hideable: false,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>
                <View />
              </Link>
            ),
          },
        ]}
        rows={orderBy(
          brands
            .filter((b) => !isRequestOpen(b))
            .map((brand) => ({
              ...brand,
              brandName: brand.brandRequest?.brandName,
              category: brand.brandRequest?.category?.name,
              updatedAt: new Date(brand.updatedAt).toLocaleString(),
              createdAt: new Date(brand.createdAt).toLocaleString(),
            })),
          (b) => new Date(b.updatedAt),
          "desc"
        )}
      />
    </PageContainer>
  );
};

export default BrandList;
