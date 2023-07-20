import {
  linkPlaceholders,
  navLinks,
  routing,
  TableView,
  useCategories,
  useLoginContext,
  Button,
  useExportFile
} from "common";
import React from "react";


const ExportButton = () => {
  const { getThisFile, exportLoading } = useExportFile('PriceSheets', `/brands/exportPricesheets`);
  return <Button loading={exportLoading} onClick={() => getThisFile()}>Export</Button>
}

const BrandList = () => {
  const { isPriceSheetsAdmin } = useLoginContext();
  const adminProps = isPriceSheetsAdmin
    ? {
        deleteUrl: (id) => `/brands/${id}`,
        deleteMessage: (brand) => `Delete ${brand.name}`,
        actionLink: routing.brands.add,
        actionName: "Add Brand",
      }
    : {};
  const { categories } = useCategories();
  const filterConfig = [
    {
      name: "category",
      type: "dropdown",
      options: categories,
      label: "Filter By Category",
    },
    {
      name: "name",
      type: "input",
      label: "Search",
    },
  ];
  return (
    <TableView
      url="/brands"
      tableConfig={[
        {
          name: "name",
          header: "Name",
        },
        {
          name: "lastModifiedPricesheet",
          header: "Items Modified",
          isDate: true,
        },
        {
          name: "pricesheets",
          header: "Pricesheets",
          center: true,
        },
        {
          name: "lastUploadedBy",
          header: "Last Uploaded By",
        },
      ]}
      navLinks={navLinks[isPriceSheetsAdmin ? "brandsForAdmin" : "brands"]}
      linkParam={linkPlaceholders.brandId}
      header="Brands"
      filterConfig={filterConfig}
      {...adminProps}
      additionalActions={[<ExportButton key='exportButton' />]}
      shapeData={(d) =>
        d.data.data.map((brand) => ({
          ...brand,
          pricesheets: (brand.pricesheets?.length || 0) + 1,
          lastUploadedBy: brand.lastUploadedBy?.name,
        }))
      }
      defaultFilters={{ brand: { $exists: false } }}
      defaultParams={{ populate: "pricesheets lastUploadedBy" }}
    />
  );
};

export default BrandList;
