import { orderBy } from "lodash";
import styled from "styled-components";
import { baseURL } from "./axios";

const isMissing = (name = "Name") => `${name} is Missing`;

const addPointerToIcon = (Icon) => styled(Icon)`
  cursor: pointer;
`;

const downloadFile = (file, filename = "Sample.xlsx") => {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
};

const openNewTab = (href = "") => {
  const a = document.createElement("a");
  a.target = "_blank";
  a.href = href;
  a.click();
  a.remove();
};

const fetchImage = (filename = "") => `${baseURL}/files/${filename}`;
const getApiPath = (route = "") => `${baseURL}/${route}`;
const getFilename = (filename = "") => filename.split("__")?.[2] || "";

const sortAndFormatOptions = ({
  list = [],
  valueKey = "id",
  labelKey = "name",
}) => {
  return orderBy(
    list.map((item) => ({
      value: typeof valueKey === "function" ? valueKey(item) : item[valueKey],
      label: typeof labelKey === "function" ? labelKey(item) : item[labelKey],
    })),
    [(item) => item.label.toLowerCase()],
    ["asc"]
  );
};

const getContactLabel = (contact) => `${contact.name} (${contact.email})`;

const convertListToKeyValuePair = (
  list = [],
  idKey = "id",
  valueKey = "name"
) =>
  list.reduce((acc, item) => ({ ...acc, [item[idKey]]: item[valueKey] }), {});

const formatNumber = (number, showZero = true) => {
  if (number) {
    return Intl.NumberFormat().format(+number);
  }
  return showZero ? 0 : "";
};

const getSite = () => process.env.REACT_APP_SITE || "WorkPortal";
const isKanda = () => getSite() === "KANDA";

const isRequestOpen = (request) =>
  ["Open", "Ordered", "Closed"].includes(request?.status);

export {
  getSite,
  addPointerToIcon,
  formatNumber,
  downloadFile,
  fetchImage,
  getApiPath,
  isMissing,
  openNewTab,
  sortAndFormatOptions,
  getContactLabel,
  convertListToKeyValuePair,
  isKanda,
  getFilename,
  isRequestOpen,
};
