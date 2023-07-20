import { brandRequestStatusObject } from "./config";

const getSourcingStatusList = (brandRequests = []) => {
  const values = Object.values(brandRequestStatusObject).map((o) => ({
    ...o,
    ids: {},
  }));
  for (const { value, statuses } of brandRequests) {
    for (const status of statuses) {
      const valueObject = values.find((v) => v.value === status);
      if (valueObject) {
        valueObject.ids[value] = value;
      }
    }
  }
  return values.map((v) => ({ ...v, total: Object.values(v.ids).length }));
};

const loanPOPrefix = "PO-";
const loanSOPrefix = "SO-";

export { getSourcingStatusList, loanPOPrefix, loanSOPrefix };
