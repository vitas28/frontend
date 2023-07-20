import {
  brandRequestStatusObject,
  Button,
  DividerHorizontal,
  Dropdown,
  getSourcingStatusList,
  RowFlex,
  Spinner,
  useAxios,
} from "common";
import { useVendorUserVendor } from "modules/VendorUserLandingPage";
import React, { Fragment } from "react";
import { useParams } from "react-router-dom";
import BrandDetails from "./BrandDetails";
import FollowUps from "./FollowUps";
import Orders from "./Orders";
import { Container } from "./styles";

const ViewBrand = () => {
  const { vendorRequestId } = useParams();
  const { vendor, refetchVendor, vendorLoading } = useVendorUserVendor();
  const { callAxios, loading } = useAxios({
    onComplete: () => refetchVendor(),
  });
  const vendorRequest = vendor.vendorRequests?.find(
    (vr) => vr.id === vendorRequestId
  );
  const isOpen = ["Open", "Closed", "Ordered"].includes(vendorRequest.status);
  const url = `vendorRequests/${vendorRequest.id}`;

  const statusOptions = getSourcingStatusList();
  return (
    <Container>
      <RowFlex extend responsive>
        <RowFlex column>
          <RowFlex>
            <h2>{vendorRequest.brandRequest.brandName}</h2>
            {vendorLoading && <Spinner inline />}
          </RowFlex>
          <div> Category: {vendorRequest.brandRequest.category.name}</div>
          <div>
            Status:{" "}
            <strong>
              {brandRequestStatusObject[vendorRequest.status]?.label}
            </strong>
          </div>
        </RowFlex>
        <RowFlex responsive column>
          {isOpen && vendorRequest.status !== "Closed" && (
            <div style={{ width: "200px" }}>
              <Button
                loading={loading}
                onClick={() =>
                  callAxios({
                    method: "PUT",
                    url,
                    data: { status: "Closed" },
                  })
                }
              >
                MOVE TO CLOSED
              </Button>
            </div>
          )}
          {!isOpen && (
            <Fragment>
              <div style={{ width: "150px" }}>
                <Button
                  loading={loading}
                  onClick={() =>
                    callAxios({
                      method: "PUT",
                      url,
                      data: { status: "Open" },
                    })
                  }
                >
                  MOVE TO OPEN
                </Button>
              </div>
              <div style={{ width: "150px" }}>
                <Dropdown
                  label="Status"
                  loading={loading}
                  value={vendorRequest.status}
                  options={statusOptions}
                  onChange={(status) => {
                    callAxios({
                      method: "PUT",
                      url,
                      data: { status },
                    });
                  }}
                />
              </div>
            </Fragment>
          )}
        </RowFlex>
      </RowFlex>
      <DividerHorizontal pad />
      <BrandDetails callAxios={callAxios} isOpen={isOpen} />

      <DividerHorizontal pad />
      {isOpen ? (
        <Orders callAxios={callAxios} loading={loading} />
      ) : (
        <FollowUps callAxios={callAxios} loading={loading} />
      )}
    </Container>
  );
};

export default ViewBrand;
