import {
  generateLinkWithParams,
  getSourcingStatusList,
  Link,
  linkPlaceholders,
  routing,
  TableView,
  useAxios,
  useBrandRequests,
  useLoginContext,
  useToast,
  useVendors,
} from "common";
import React from "react";
import BulkStatusChange from "../ViewBrandRequest/BulkStatusChange";
import VendorEmailForm from "./VendorEmailForm";

const VendorRequestList = () => {
  const { isSourcingAdmin } = useLoginContext();
  const { alertSuccess } = useToast();
  const { callAxios, loading } = useAxios();
  const vendors = useVendors();
  const { brandRequests } = useBrandRequests();
  const adminProps = isSourcingAdmin
    ? {
        deleteUrl: (vrId) => `vendorRequests/${vrId}`,
      }
    : {};
  const filterConfig = [
    {
      name: "vendor",
      type: "dropdown",
      options: vendors,
      label: "Filter By Vendor",
    },
    {
      name: "brandRequest",
      type: "dropdown",
      options: brandRequests,
      label: "Filter By Brand",
    },
    {
      name: "status",
      type: "dropdown",
      options: getSourcingStatusList(),
      label: "Filter By Status",
    },
  ];
  return (
    <TableView
      url="/vendorRequests"
      tableConfig={[
        {
          name: "brand",
          header: "Brand",
        },
        {
          name: "vendor",
          header: "Vendor",
        },
        {
          name: "country",
          header: "Country",
        },
        {
          name: "user",
          header: "Requested By",
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
              alertSuccess("Status Updated!");
              reloadTable();
            });
          },
          loading,
        },
      ]}
      header="All Vendor Requests"
      filterConfig={filterConfig}
      {...adminProps}
      defaultParams={{
        populate: "vendorData brandRequest user",
      }}
      bulkActions={[
        { name: "Change Status", Component: BulkStatusChange },
        { name: "Email Vendors", Component: VendorEmailForm },
      ]}
      shapeData={(d) => {
        return d.data.data
          .filter((d) => d.brandRequest)
          .map((request) => {
            return {
              ...request,
              brand: (
                <Link
                  to={generateLinkWithParams(routing.brandRequests.view, {
                    [linkPlaceholders.brandRequestId]: request.brandRequest.id,
                  })}
                >
                  {request.brandRequest.brandName}
                </Link>
              ),
              vendor: (
                <Link
                  to={generateLinkWithParams(routing.vendors.view, {
                    [linkPlaceholders.vendorId]: request.vendorData.id,
                  })}
                >
                  {request.vendorData.name}
                </Link>
              ),
              country: request.vendorData.country,
              user: request.user?.name,
            };
          });
      }}
    />
  );
};

export default VendorRequestList;
