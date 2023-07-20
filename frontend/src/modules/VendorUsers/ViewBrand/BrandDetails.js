import { Add, Download, View } from "@carbon/icons-react";
import {
  DatePicker,
  fetchImage,
  getFilename,
  RowFlex,
  Spinner,
  TextField,
  TextStyledLink,
  Toggle,
  useUploadFile,
} from "common";
import { useVendorUserVendor } from "modules/VendorUserLandingPage";
import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BrandDetails = ({ callAxios, isOpen }) => {
  const { vendorRequestId } = useParams();
  const { vendor } = useVendorUserVendor();
  const vendorRequest = vendor.vendorRequests?.find(
    (vr) => vr.id === vendorRequestId
  );
  const url = `vendorRequests/${vendorRequest.id}`;
  const { uploadFile, uploadLoading } = useUploadFile();
  const [notes, setNotes] = useState(vendorRequest.notes || "");
  const [website, setWebsite] = useState(
    vendorRequest.url || vendorRequest.brandRequest.url || ""
  );
  const [emails, setEmails] = useState(vendorRequest.emails || []);
  const [phone, setPhone] = useState(vendorRequest.phone || "");
  const [linkedIn, setLinkedIn] = useState(!!vendorRequest.linkedIn);
  const [orderForm, setOrderForm] = useState(vendorRequest.orderForm || "");
  const [pricesheet, setPricesheet] = useState(vendorRequest.pricesheet || "");
  const hasPricesheet = !!pricesheet;
  const [training, setTraining] = useState(vendorRequest.training);
  const [terms, setTerms] = useState(vendorRequest.terms);
  const [discount, setDiscount] = useState(vendorRequest.discount);
  const [fob, setFob] = useState(vendorRequest.fob);

  useEffect(() => {
    const timeout = setTimeout(() => {
      callAxios({
        method: "PUT",
        url,
        data: {
          notes,
          url: website,
          emails,
          phone,
          linkedIn,
          orderForm,
          hasPricesheet,
          pricesheet,
          training,
          fob,
          terms,
          discount,
        },
      });
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    notes,
    url,
    website,
    emails,
    phone,
    linkedIn,
    orderForm,
    pricesheet,
    hasPricesheet,
    training,
    fob,
    terms,
    discount,
  ]);

  return (
    <Fragment>
      <RowFlex extend responsive style={{ alignItems: "start" }}>
        <RowFlex column style={{ alignItems: "start" }}>
          <RowFlex>
            <TextField
              label="Website"
              value={website}
              onChange={(v) => setWebsite(v)}
            />
            {website && (
              <a href={website} target="_blank" rel="noreferrer">
                <View />
              </a>
            )}
          </RowFlex>
          <RowFlex>
            <h4>Emails</h4>
            <TextStyledLink>
              <Add
                onClick={() => setEmails((p) => [...p.filter(Boolean), ""])}
              />
            </TextStyledLink>
          </RowFlex>
          <RowFlex responsive>
            {emails.map((email, idx) => (
              <RowFlex key={idx}>
                <TextField
                  value={email}
                  onChange={(v) =>
                    setEmails((prev) =>
                      prev.map((p, pIdx) => (pIdx === idx ? v : p))
                    )
                  }
                />
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setEmails((p) => p.filter((_, pIdx) => pIdx !== idx));
                  }}
                >
                  X
                </div>
              </RowFlex>
            ))}
          </RowFlex>
          <TextField
            label="Phone"
            value={phone}
            onChange={(v) => setPhone(v)}
          />
          <RowFlex responsive>
            <Toggle
              checked={linkedIn}
              onChange={setLinkedIn}
              label="LinkedIn"
            />
            {orderForm && (
              <TextStyledLink>
                <a
                  href={fetchImage(orderForm)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <RowFlex>
                    Download Online Form
                    <Download />
                    <p>{getFilename(orderForm)}</p>
                  </RowFlex>
                </a>
              </TextStyledLink>
            )}
          </RowFlex>
          <h4>Upload {orderForm ? "New" : ""} Online Form</h4>
          <input
            type="file"
            accept="*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.files = null;
              e.target.value = null;
              if (!file) return;
              uploadFile(file).then(({ data: { filename } }) =>
                setOrderForm(filename)
              );
            }}
          />
          {uploadLoading && <Spinner inline />}
          {isOpen && (
            <Fragment>
              <DatePicker
                value={training}
                onChange={setTraining}
                label="Training"
              />
              <RowFlex>
                <TextField label="Terms" value={terms} onChange={setTerms} />
                <TextField
                  label="Discount"
                  value={discount}
                  onChange={setDiscount}
                />
                <TextField label="FOB" value={fob} onChange={setFob} />
              </RowFlex>
            </Fragment>
          )}
        </RowFlex>
        <div style={{ maxWidth: "300px" }}>
          {isOpen && (
            <Fragment>
              <RowFlex responsive>
                {pricesheet && (
                  <TextStyledLink>
                    <a
                      href={fetchImage(pricesheet)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <RowFlex>
                        Download Pricesheet
                        <Download />
                        <p>{getFilename(pricesheet)}</p>
                      </RowFlex>
                    </a>
                  </TextStyledLink>
                )}
              </RowFlex>
              <h4>Upload {pricesheet ? "New" : ""} Pricesheet</h4>
              <input
                type="file"
                accept="*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.files = null;
                  e.target.value = null;
                  if (!file) return;
                  uploadFile(file).then(({ data: { filename } }) =>
                    setPricesheet(filename)
                  );
                }}
              />
              {uploadLoading && <Spinner inline />}
            </Fragment>
          )}
          <TextField
            isArea
            value={notes}
            onChange={(v) => setNotes(v)}
            label="Notes"
          />
        </div>
      </RowFlex>
    </Fragment>
  );
};

export default BrandDetails;
