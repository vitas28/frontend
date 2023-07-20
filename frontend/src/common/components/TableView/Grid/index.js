import { theme, useModalContext } from "common/context";
import {
  GridContainer,
  IconOptions,
  Link,
  RowFlex,
  TopBar,
} from "common/styles";
import React from "react";
import Select from "react-select";
import Spinner from "../../Spinner";
import { renderElement } from "../functions";
import { BulkAction, iconObject } from "../styles";
import { GridItem } from "./styles";

const Grid = ({
  additionalLinkParams = {},
  deleteElement,
  pinElement,
  gridColumns = 3,
  gridConfig,
  gridHeaderComponentFunction = () => <div />,
  gridHeadingFunction = () => "",
  hasBulkActions,
  linkParam,
  navLinks = [],
  onActionComplete = () => {},
  reloadTable,
  response,
  searchParams = "",
  selectedIds = [],
  setSelectedIds,
  shapedData = [],
  tableConfig = [],
}) => {
  const { setModalContent, closeModal } = useModalContext();
  if (!response) {
    return <Spinner inline />;
  }
  return (
    <GridContainer
      columns={gridColumns}
      noBg
      style={{ background: theme.colors.lightestGrey }}
    >
      {shapedData.map((item) => {
        const params = { [linkParam]: item.id, ...additionalLinkParams };
        return (
          <GridItem key={item.id}>
            <TopBar>
              <RowFlex>
                {hasBulkActions && (
                  <BulkAction
                    checked={selectedIds.includes(item.id)}
                    onClick={() => {
                      setSelectedIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((i) => i !== item.id)
                          : [...prev, item.id]
                      );
                    }}
                  />
                )}
                {gridHeaderComponentFunction(item)}
              </RowFlex>
              <IconOptions>
                {navLinks.map((navLink) => (
                  <Link
                    key={navLink.name}
                    to={`${navLink.link(params)}${searchParams}`}
                  >
                    {navLink.icon}
                  </Link>
                ))}
                {pinElement(item)}
                {deleteElement(item)}
              </IconOptions>
            </TopBar>
            <h4>{gridHeadingFunction(item)}</h4>
            {(gridConfig || tableConfig).map(
              ({
                name,
                header,
                isDropdown,
                options = [],
                onChange = () => {},
                loading: dropdownLoading,
                type,
                icon,
                Component = () => <div>LOL</div>,
                componentProps = {},
                ...rest
              }) => {
                const value = item[name];
                const dropdownElement =
                  isDropdown &&
                  (dropdownLoading ? (
                    <Spinner inline />
                  ) : (
                    <Select
                      defaultValue={options.find((o) => o.value === value)}
                      options={options}
                      onChange={(first) => {
                        onChange(item, first.value, reloadTable);
                      }}
                    />
                  ));
                const Icon = iconObject[icon];
                const modalElement = type === "modal" && (
                  <Icon
                    onClick={() => {
                      setModalContent(
                        <Component
                          row={item}
                          close={closeModal}
                          reloadTable={reloadTable}
                          onActionComplete={onActionComplete}
                          {...(typeof componentProps === "function"
                            ? componentProps(item)
                            : componentProps)}
                        />
                      );
                    }}
                  />
                );
                return (
                  <RowFlex extend key={name} margin>
                    <div>{header}:</div>
                    {dropdownElement || modalElement || (
                      <strong style={{ textAlign: "right" }}>
                        {renderElement({
                          value,
                          ...rest,
                        })}
                      </strong>
                    )}
                  </RowFlex>
                );
              }
            )}
          </GridItem>
        );
      })}
    </GridContainer>
  );
};

export { Grid };
