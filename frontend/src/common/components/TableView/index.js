import { useModalContext } from "common/context";
import { useFiltersAndPagination, useListView } from "common/hooks";
import { DeleteIcon, Link, RowFlex, TopBar, PinIcon, PinnedIcon } from "common/styles";
import { Field, Formik } from "formik";
import { omit } from "lodash";
import React, { Fragment, useEffect, useState } from "react";
import { useAxios } from "../../axios";
import { Button } from "../Buttons";
import Dropdown from "../Dropdown";
import { DeleteItemModal } from "../Modals";
import { Grid } from "./Grid";
import { List, Table } from "./List";
import { BulkAction, Container, TableContainer } from "./styles";

const TableView = ({
  ActionComponent = () => <div>Component</div>,
  actionComponentProps = {},
  actionLink = "",
  actionModal = false,
  actionName = "",
  additionalActions = [],
  additionalLinkParams = {},
  bulkActions = [],
  darker = false,
  dataGrid = false,
  defaultFilters = {},
  defaultParams = {},
  deleteMessage = () => "Delete Item",
  deleteUrl,
  pinUrl,
  filterConfig = [],
  gridColumns = 3,
  gridConfig,
  gridHeaderComponentFunction = () => <div />,
  gridHeadingFunction = () => "",
  header = "Table",
  HeaderComponent = () => null,
  height = "65vh",
  initialSort = localStorage.getItem("sort" + header) || "-createdAt",
  linkParam,
  navLinks = [],
  noHeader = false,
  onActionComplete = () => {},
  searchParams = "",
  shapeData = (res) => res.data.data,
  sortConfig = [],
  tableConfig = [],
  to = "",
  url,
}) => {
  const sortOptions = sortConfig.reduce(
    (acc, sc) => [
      ...acc,
      { value: sc.name, label: `${sc.header} Asc.` },
      { value: `-${sc.name}`, label: `${sc.header} Desc.` },
    ],
    []
  );
  const hasBulkActions = bulkActions.length > 0;
  const [selectedIds, setSelectedIds] = useState([]);
  const [sort, setSort] = useState(initialSort);
  const { isList, listViewComponent: lvc } = useListView();
  const makeFilters = (propFilters) => {
    if (propFilters || defaultFilters) {
      return {
        ...(propFilters || {}),
        ...(defaultFilters || {}),
        ...(defaultParams?.filters || {}),
      };
    }
  };
  const { setModalContent, closeModal } = useModalContext();
  const { response, callAxios, loading } = useAxios();
  const { callAxios: pinItemAxios } = useAxios({
    alertSuccess: "Pinned Successfully",
    onComplete: () => {
      setSkip(0);
      reloadTable();
      onActionComplete();
    },
  });
  const onPin = (item) => {
    pinItemAxios({
      url: pinUrl(item.id),
    });
  }
  const recallFunction = (props) => {
    setSelectedIds([]);
    callAxios({
      url,
      method: "GET",
      params: {
        limit: dataGrid ? 10000000 : props.limit,
        sort,
        skip: dataGrid ? 0 : props.skip,
        filters: makeFilters(props.filters),
        ...omit(defaultParams, ["filters"]),
      },
    });
  };

  const {
    paginationComponent,
    filtersComponent,
    limit,
    skip,
    filters,
    setSkip,
  } = useFiltersAndPagination({
    total: response?.data.pagination.total,
    recallFunction,
    filterConfig,
  });

  const reloadTable = () => recallFunction({ limit, skip, filters });

  useEffect(() => {
    reloadTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultParams), JSON.stringify(defaultFilters), sort]);

  const hasAction =
    (actionName && (actionLink || actionModal)) || additionalActions.length > 0;
  const shapedData = response ? shapeData(response) : [];

  const bulkActionElement =
    selectedIds.length > 0 &&
    bulkActions.map((action) => (
      <Button
        key={action.name}
        onClick={() => {
          setModalContent(
            <action.Component
              close={closeModal}
              reloadTable={reloadTable}
              onActionComplete={onActionComplete}
              ids={selectedIds}
              {...action.componentProps}
            />
          );
        }}
      >
        {action.name}
      </Button>
    ));

  const filterElement =
    !dataGrid && filterConfig?.length > 0 && filtersComponent;
  const View = isList || dataGrid ? List : Grid;

  const bulkActionsElementForGrid = !isList && hasBulkActions && (
    <BulkAction
      checked={shapedData.length === selectedIds.length}
      onClick={() =>
        setSelectedIds((prev) =>
          prev.length === shapedData.length ? [] : shapedData.map((r) => r.id)
        )
      }
    />
  );

  const deleteElement = (item) =>
    deleteUrl && (
      <DeleteIcon
        onClick={() => {
          setModalContent(
            <DeleteItemModal
              closeModal={closeModal}
              item={item}
              deleteMessage={deleteMessage}
              onComplete={() => {
                setSkip(0);
                reloadTable();
                closeModal();
                onActionComplete();
              }}
              deleteUrl={deleteUrl}
            />
          );
        }}
      />
    );

  const pinElement = (item) => {
    return pinUrl && (
      item.isPinned ? <PinnedIcon onClick={() => onPin(item)} /> : <PinIcon onClick={() => onPin(item)} />
    )
  }

  const listViewComponent = (
    <RowFlex responsive>
      {sortOptions.length > 0 && (
        <Formik initialValues={{ sort }}>
          <div style={{ width: "200px" }}>
            <Field
              component={Dropdown}
              options={sortOptions}
              name="sort"
              placeholder="Sort By"
              fieldOnly
              onChange={(v) => {
                localStorage.setItem("sort" + header, v);
                setSort(v);
                setSkip(0);
              }}
            />
          </div>
        </Formik>
      )}
      {lvc}
    </RowFlex>
  );

  return (
    <Container dataGrid={dataGrid}>
      {!noHeader && (
        <TopBar>
          <h1>{header}</h1>
          <RowFlex responsive>
            {bulkActionElement}
            <HeaderComponent filters={makeFilters(filters)} />
            {listViewComponent}
            {hasAction && (
              <Fragment>
                {additionalActions}
                {actionModal ? (
                  <div>
                    <Button
                      onClick={() => {
                        setModalContent(
                          <ActionComponent
                            {...actionComponentProps}
                            close={closeModal}
                            reloadTable={reloadTable}
                            onActionComplete={onActionComplete}
                          />
                        );
                      }}
                    >
                      {actionName}
                    </Button>
                  </div>
                ) : (
                  <Link to={actionLink}>
                    <Button>{actionName}</Button>
                  </Link>
                )}
              </Fragment>
            )}
          </RowFlex>
        </TopBar>
      )}
      {noHeader && hasBulkActions ? (
        <div
          style={{
            display: "grid",
            alignItems: "center",
            gridTemplateColumns: "auto 1fr auto auto",
            gridGap: "0.5rem",
          }}
        >
          {bulkActionsElementForGrid || <div />}
          {filterElement}
          {listViewComponent}
          <RowFlex>{bulkActionElement}</RowFlex>
        </div>
      ) : (
        <Fragment>
          {filterElement}
          {noHeader && listViewComponent}
          {bulkActionsElementForGrid}
        </Fragment>
      )}
      <TableContainer height={dataGrid ? "75vh" : height}>
        <View
          additionalLinkParams={additionalLinkParams}
          darker={darker}
          dataGrid={dataGrid}
          deleteElement={deleteElement}
          deleteUrl={deleteUrl}
          pinElement={pinElement}
          pinUrl={pinUrl}
          gridColumns={gridColumns}
          gridConfig={gridConfig}
          gridHeaderComponentFunction={gridHeaderComponentFunction}
          gridHeadingFunction={gridHeadingFunction}
          hasBulkActions={hasBulkActions}
          linkParam={linkParam}
          loading={loading}
          navLinks={navLinks}
          onActionComplete={onActionComplete}
          reloadTable={reloadTable}
          response={response}
          searchParams={searchParams}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          shapedData={shapedData}
          tableConfig={tableConfig}
          to={to}
        />
      </TableContainer>
      {!dataGrid && paginationComponent}
    </Container>
  );
};

export { TableView, Table };
