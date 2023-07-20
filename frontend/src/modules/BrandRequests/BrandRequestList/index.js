import {
  allBrandRequestStatuses,
  baseURL,
  brandRequestStatusObject,
  Button,
  DropdownButton,
  generateLinkWithParams,
  getSourcingStatusList,
  ItemSplitter,
  Link,
  linkPlaceholders,
  navLinks,
  routing,
  Tab,
  TabContainer,
  TabDisplay,
  TableView,
  Tabs,
  TopBar,
  useBrandRequests,
  useCategories,
  useLoginContext,
  useVendors,
} from "common";
import React from "react";
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import StatusChangeForm from "./StatusChangeForm";
import { Container, VendorField } from "./styles";
import VendorAddForm from "./VendorAddForm";

const ALL = "ALL";
const UNWORKED = "UNWORKED";
const allStatuses = allBrandRequestStatuses.filter(
  (br) => ![brandRequestStatusObject.Open.value].includes(br)
);

const allUnworkedStatuses = [
  brandRequestStatusObject.Unworked.value,
  brandRequestStatusObject.NoneAvailability.value,
];

const downloadExport = (status) => {
  const a = document.createElement("a");
  a.target = "_blank";
  a.href = `${baseURL}/brandRequests/export?status=${status}`;
  a.click();
  a.remove();
};

const BrandRequestList = () => {
  const [p] = useSearchParams();
  const selectedStatus = p.get("status");
  const isPinnedSelected = p.get('pinned')
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { brandRequests, refetch, loading } = useBrandRequests();
  const { isSourcingAdmin } = useLoginContext();
  const adminProps = isSourcingAdmin
    ? {
        deleteUrl: (id) => `/brandRequests/${id}`,
        deleteMessage: (br) => `Delete ${br.brandName}`,
        pinUrl: (id) => `/brandRequests/pin/${id}`
      }
    : {};
  const { categories } = useCategories();
  const vendors = useVendors();
  const statuses = getSourcingStatusList(brandRequests);
  const isAll = selectedStatus === ALL;
  const isUnworked = selectedStatus === UNWORKED;
  const defaultStatusFilters = {
    statuses: isAll ? { $in: allStatuses, } : isUnworked ? { $in: allUnworkedStatuses, } : selectedStatus,
  }
  const defaultPinnedFilters = {
    isPinned: true,
    statuses: { $in: allStatuses, }
  }
  const defaultFilters = isPinnedSelected ? defaultPinnedFilters : defaultStatusFilters
  const filterConfig = [
    {
      name: "brandName",
      type: "input",
      label: "Search",
    },
    {
      name: "category",
      type: "dropdown",
      options: categories,
      label: "Filter By Category",
    },
    {
      name: "vendor",
      type: "dropdown",
      options: vendors,
      label: "Filter By Vendor",
    },
  ];

  const exportOptions = [
    <div onMouseDown={() => downloadExport("AllWorkedOn")}>All Worked On</div>,
    ...statuses.map(({ value, label }) => {
      return (
        <div key={value} onMouseDown={() => downloadExport(value)}>
          {label}
        </div>
      );
    }),
  ];

  const navigateTo = (status = ALL) => {
    navigate({ pathname, search: `?${createSearchParams({ status })}` });
  };

  const navigateToPinned = () => {
    navigate({ pathname, search: `?${createSearchParams({ status: ALL, pinned: 1 })}` });
  };

  if (!selectedStatus) {
    navigateTo();
  }

  return (
    <Container>
      <TopBar>
        <h1>Brands</h1>
        <div>
          <ItemSplitter style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <DropdownButton secondary options={exportOptions}>
              Export Report
            </DropdownButton>
            <Link to={routing.brandRequests.add}>
              <Button>Request A Brand</Button>
            </Link>
            <Link to={routing.brandRequests.bulkImport}>
              <Button>Bulk Import</Button>
            </Link>
          </ItemSplitter>
        </div>
      </TopBar>
      <TabContainer>
        <Tabs>
          <Tab isActive={isAll && !isPinnedSelected} onClick={() => navigateTo(ALL)}>
            All Working On
            <sup>
              {loading
                ? "..."
                : Object.keys(
                    statuses.reduce(
                      (acc, { ids, value }) => ({
                        ...acc,
                        ...(allStatuses.includes(value) ? ids : {}),
                      }),
                      {}
                    )
                  ).length}
            </sup>
          </Tab>
          <Tab isActive={isUnworked && !isPinnedSelected} onClick={() => navigateTo(UNWORKED)}>
            Unworked
            <sup>
              {loading
                ? "..."
                : Object.keys(
                    statuses.reduce(
                      (acc, { ids, value }) => ({
                        ...acc,
                        ...(allUnworkedStatuses.includes(value) ? ids : {}),
                      }),
                      {}
                    )
                  ).length}
            </sup>
          </Tab>
          {statuses
            .filter(
              ({ value }) =>
                ![brandRequestStatusObject.Unworked.value].includes(value)
            )
            .map(({ value, total, label }) => {
              return (
                <Tab
                  isActive={value === selectedStatus && !isPinnedSelected}
                  onClick={() => navigateTo(value)}
                >
                  {label} <sup>{loading ? "..." : total}</sup>
                </Tab>
              );
            })}
          <Tab isActive={isPinnedSelected} onClick={navigateToPinned}>
          Pinned
          <sup>
            {loading ? "..." : brandRequests.filter(br => br.isPinned === true).length}
          </sup>
        </Tab>
        </Tabs>
        <TabDisplay>
          <TableView
            selectView
            to={routing.brandRequests.view}
            bulkActions={[
              { name: "Assign Vendors", Component: VendorAddForm },
              { name: "Change Status", Component: StatusChangeForm },
            ]}
            url="/brandRequests"
            tableConfig={[
              {
                name: "brandName",
                header: "Brand Name",
              },
              {
                name: "category",
                header: "Category",
              },
              {
                name: "requestedByCustomer",
                header: "Customer",
              },
              ...(isAll || isUnworked
                ? [{ name: "statuses", header: "Statuses" }]
                : []),
              {
                name: "requestBy",
                header: "Requested By",
              },
              {
                name: "createdAt",
                header: "Requested Date",
                isDate: true,
              },
              {
                name: "vendors",
                header: "Assigned To",
                noTo: true,
              },
            ]}
            filterConfig={filterConfig}
            darker
            navLinks={navLinks.brandRequests(isSourcingAdmin)}
            linkParam={linkPlaceholders.brandRequestId}
            noHeader
            onActionComplete={refetch}
            {...adminProps}
            height="55vh"
            defaultParams={{
              populate: JSON.stringify([
                { path: "user" },
                { path: "category" },
                {
                  path: "vendorRequests",
                  populate: "vendor",
                },
              ]),
            }}
            defaultFilters={defaultFilters}
            shapeData={(res) =>
              res.data.data.map((d) => ({
                ...d,
                requestBy: d.user?.name || d.requestBy,
                category: d.category?.name,
                statuses: d.statuses
                  .map((status) => brandRequestStatusObject[status].label)
                  .join(", "),
                vendors: d.vendorRequests.map((v) => (
                  <Link
                    to={generateLinkWithParams(routing.vendors.view, {
                      [linkPlaceholders.vendorId]: v.vendor.id,
                    })}
                  >
                    <VendorField>{v.vendor.name}</VendorField>
                  </Link>
                )),
              }))
            }
          />
        </TabDisplay>
      </TabContainer>
    </Container>
  );
};

export default BrandRequestList;
