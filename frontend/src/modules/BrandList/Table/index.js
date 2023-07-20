import { Email } from "@carbon/icons-react";
import {
  Button,
  downloadFile,
  OverflowContainer,
  RowFlex,
  Spinner,
  useAxios,
  useFilters,
  useLoginContext,
  useModalContext,
  DropdownButton
} from "common";
import { orderBy } from "lodash";
import { uniq } from "ramda";
import React, { useState } from "react";
import BrandAddLine from "./BrandAddLine";
import BrandListForm from "./BrandListForm";
import BrandListLine from "./BrandListLine";
import EmailForm from "./EmailForm";
import {
  CategoryColumn,
  CategoryColumnHeader,
  Columns,
  Container,
} from "./styles";

const NEW_BRANDS_CATEGORY = "NEW_BRANDS_CATEGORY";
const INACTIVE_BRANDS = "INACTIVE_BRANDS";

const BrandListTable = () => {
  const { setModalContent, closeModal } = useModalContext();
  const { isBrandListAdmin } = useLoginContext();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const hasSelection = selectedCategoryIds.length > 0;

  const { callAxios, loading: exportLoading } = useAxios({
    onComplete: ({ data }) => {
      downloadFile(data, "Brand List.xlsx");
    },
  });

  const [brandList, setBrandList] = useState([]);
  const newBrands = brandList.filter(
    (bl) => bl.showAsNewBrand && !bl.isInactive
  );
  const inactiveBrands = brandList.filter((bl) => bl.isInactive);

  const {
    refetch,
    loading,
    callAxios: getBrands,
  } = useAxios({
    callOnLoad: {
      method: "GET",
      url: "/brandList",
      params: { limit: 1000000, populate: "category inactiveBy" },
    },
    onComplete: (d) => setBrandList(d?.data.data || []),
  });

  const { response: cResponse, loading: cLoading } = useAxios({
    callOnLoad: {
      method: "GET",
      url: "/categories",
      params: { limit: 1000000, filters: { sortOrder: { $exists: true } } },
    },
  });

  const categories = orderBy(
    uniq(
      [
        ...brandList.map((b) => b.category),
        ...(cResponse?.data.data || []),
      ].filter(Boolean)
    ),
    ["sortOrder", (c) => c.name.trim().toLowerCase()]
  );

  const recallFunction = ({ filters }) => {
    getBrands({
      method: "GET",
      url: "/brandList",
      params: {
        limit: 1000000,
        populate: "category inactiveBy",
        filters,
      },
    });
  };

  const { filtersComponent } = useFilters({
    filterConfig: [
      {
        name: "name",
        type: "input",
        label: "Search Brands",
      },
    ],
    recallFunction,
  });

  const { callAxios: addOrDeleteBrand, loading: addLoading } = useAxios({
    onComplete: () => {
      closeModal();
      refetch();
    },
  });

  const deleteBrand = (id) => {
    addOrDeleteBrand({ url: `/brandList/${id}`, method: "DELETE" });
  };

  const formProps = {
    close: closeModal,
    refetch,
    onDelete: deleteBrand,
    deleteLoading: addLoading,
  };

  const onExport = ({ hasBrands, skipBrands }) => {
    const defaultFilters = { categoryIds: selectedCategoryIds.join(",") }
    let params = defaultFilters
    if (hasBrands) {
      params = { ...defaultFilters, hasBrands: true }
    } else if (skipBrands) {
      params = { ...defaultFilters, skipBrands: true }
    }
    callAxios({
      method: "GET",
      url: "/brandList/export",
      responseType: "blob",
      params
    });
  }

  const { response } = useAxios({
    clearResponse: false,
    callOnLoad: {
      method: "GET",
      url: `/brands`,
    },
  });

  const responseData = response?.data.data

  const exportOptions = [
    <div key="exportAll" onClick={() => onExport()}>All</div>,
    <div key="exportWithBrands" onClick={() => onExport({ hasBrands: true })}>With pricesheets</div>,
    <div key="exportWithoutBrands" onClick={() => onExport({ skipBrands: true })}>Without pricesheets</div>,
  ];

  return (
    <Container>
      <RowFlex extend responsive>
        <RowFlex>
          <h3>Brand List</h3>
          {(loading || cLoading || addLoading) && <Spinner inline />}
        </RowFlex>
        <RowFlex responsive>
          {filtersComponent}
          {isBrandListAdmin && (
            <Button
              loading={addLoading}
              fit
              onClick={() => {
                setModalContent(<BrandListForm {...formProps} />);
              }}
            >
              +
            </Button>
          )}
          <DropdownButton loading={exportLoading} secondary options={exportOptions}>
            Export {hasSelection && "Selected"}
          </DropdownButton>
          <Button
            fit
            loading={exportLoading}
            onClick={() => {
              setModalContent(
                <EmailForm
                  close={closeModal}
                  selectedCategoryIds={selectedCategoryIds}
                />
              );
            }}
          >
            <Email />
            Email {hasSelection && "Selected"}
          </Button>
        </RowFlex>
      </RowFlex>

      <OverflowContainer>
        <Columns responsive>
          {[
            ...categories,
            { name: "New Brands", id: NEW_BRANDS_CATEGORY },
            { name: "Inactive Brands", id: INACTIVE_BRANDS },
          ].map(({ name, id }) => {
            const checked = selectedCategoryIds.includes(id);
            const isNewBrands = id === NEW_BRANDS_CATEGORY;
            const isInactiveBrands = id === INACTIVE_BRANDS;
            const categoryBrands = isNewBrands
              ? newBrands
              : isInactiveBrands
              ? inactiveBrands
              : brandList.filter((b) => b.category.id === id && !b.isInactive);
            return (
              <CategoryColumn key={id}>
                <CategoryColumnHeader extend>
                  {name}{" "}
                  {!isInactiveBrands && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedCategoryIds((prev) =>
                          prev.includes(id)
                            ? prev.filter((p) => p !== id)
                            : [...prev, id]
                        )
                      }
                    />
                  )}
                </CategoryColumnHeader>
                <OverflowContainer>
                  {orderBy(categoryBrands, (b) => b.name?.toLowerCase()).map(
                    (brand) => {
                      return (
                        <BrandListLine
                          key={brand.id}
                          brand={brand}
                          formProps={formProps}
                          setBrandList={setBrandList}
                          isNewBrands={isNewBrands}
                          data={responseData}
                        />
                      );
                    }
                  )}
                </OverflowContainer>
                {!isNewBrands && !isInactiveBrands && isBrandListAdmin && (
                  <BrandAddLine
                    onSubmit={(v) => {
                      const data = { category: id, ...v, isNewBrand: true };
                      addOrDeleteBrand({
                        method: "POST",
                        url: "/brandList",
                        data,
                      });
                    }}
                  />
                )}
              </CategoryColumn>
            );
          })}
        </Columns>
      </OverflowContainer>
    </Container>
  );
};

export default BrandListTable;
