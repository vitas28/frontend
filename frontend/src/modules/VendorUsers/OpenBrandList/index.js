import { CheckboxChecked, View } from "@carbon/icons-react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  brandRequestStatusObject,
  Button,
  generateLinkWithParams,
  Link,
  linkPlaceholders,
  PageContainer,
  routing,
  Spinner,
  useAxios,
  useModalContext,
} from "common";
import { orderBy } from "lodash";
import { useVendorUserVendor } from "modules/VendorUserLandingPage";
import React from "react";
import StatusChangeModal from "../StatusChangeModal";

const OpenBrandList = () => {
  const { setModalContent, closeModal } = useModalContext();
  const { vendor, refetchVendor, vendorLoading } = useVendorUserVendor();
  const brands = vendor.vendorRequests.filter((vr) =>
    ["Open", "Ordered", "Closed"].includes(vr.status)
  );
  const { callAxios, loading } = useAxios({
    onComplete: () => refetchVendor(),
  });
  const getTo = (vendorRequestId) =>
    generateLinkWithParams(routing.vendorUsers.viewBrand, {
      [linkPlaceholders.vendorRequestId]: vendorRequestId,
    });
  return (
    <PageContainer>
      <h3>Open Brands for {vendor.name}</h3>{" "}
      {vendorLoading && <Spinner inline />}
      <DataGrid
        autoHeight
        getRowHeight={() => "auto"}
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
            field: "openedAt",
            headerName: "Opened Date",
            description: "Date of Request",
            hideable: false,
            width: 200,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>
                {value && new Date(value).toLocaleString()}
              </Link>
            ),
          },
          {
            field: "hasPricesheet",
            headerName: "Price Sheet",
            description: "Price Sheet",
            hideable: false,
            width: 100,
            renderCell: ({ value, row }) => (
              <Link to={getTo(row.id)}>{value && <CheckboxChecked />}</Link>
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
                      isOpen
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
          brands.map((brand) => ({
            ...brand,
            brandName: brand.brandRequest?.brandName,
            category: brand.brandRequest?.category?.name,
            openedAt: new Date(
              brand.statusChanges.find((sc) => sc.status === "Open")?.timestamp
            ).toLocaleString(),
          })),
          (b) => new Date(b.updatedAt),
          "desc"
        )}
      />
    </PageContainer>
  );
};

export default OpenBrandList;
