import { DataGrid } from "@mui/x-data-grid";
import { generateLinkWithParams } from "common/config";
import { useModalContext } from "common/context";
import { Link } from "common/styles";
import React from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Spinner from "../../Spinner";
import { renderElement } from "../functions";
import { BulkAction, iconObject } from "../styles";
import { Table } from "./styles";

const List = ({
  additionalLinkParams = {},
  darker = false,
  dataGrid,
  deleteElement,
  deleteUrl,
  pinElement,
  pinUrl,
  hasBulkActions,
  linkParam,
  loading,
  navLinks = [],
  onActionComplete = () => {},
  reloadTable,
  response,
  searchParams = "",
  selectedIds = [],
  setSelectedIds,
  shapedData = [],
  tableConfig = [],
  to = "",
}) => {
  const navigate = useNavigate();
  const { setModalContent, closeModal } = useModalContext();
  if (dataGrid) {
    const gridTableConfig = [
      ...tableConfig,
      ...navLinks.map((navLink) => ({
        name: navLink.name,
        header: "",
        width: 20,
        noTo: true,
        render: (_, params) => {
          return (
            <Link to={`${navLink.link(params)}${searchParams}`}>
              {navLink.name}
            </Link>
          );
        },
      })),
      ...(deleteUrl
        ? [
          {
            name: "deleteAction",
            header: "",
            sortable: false,
            render: deleteElement,
            noTo: true,
            width: 20,
          },
        ]
        : []),
      ...('pinUrl'
        ? [
          {
            name: "pinAction",
            header: "",
            sortable: false,
            render: pinElement,
            noTo: true,
            width: 20,
          },
        ]
        : []),
      ];
    return (
      <DataGrid
        loading={loading}
        columns={gridTableConfig.map((tc) => ({
          field: tc.name,
          headerName: tc.header,
          description: tc.header,
          width: tc.width || 100,
          renderCell: ({ value, row }) => {
            const params = { [linkParam]: row.id, ...additionalLinkParams };
            const val =
              tc.render?.(row, params) || renderElement({ value, ...tc });
            return to && !tc.noTo ? (
              <Link to={generateLinkWithParams(to, params)}>{val}</Link>
            ) : (
              val
            );
          },
          sortable: tc.sortable ?? true,
          filterable: tc.sortable ?? true,
          hideable: false,
        }))}
        rows={shapedData}
        style={{ height: "100%" }}
        />
        );
      }
  return (
    <Table darker={darker}>
      <thead>
        <tr>
          {hasBulkActions && response && (
            <th>
              <BulkAction
                checked={shapedData.length === selectedIds.length}
                onClick={() =>
                  setSelectedIds((prev) =>
                    prev.length === shapedData.length
                      ? []
                      : shapedData.map((r) => r.id)
                  )
                }
              />
            </th>
          )}
          {pinUrl && <th />}
          {tableConfig.map(({ name, header: tHeader, center }) => (
            <th key={name} style={{ textAlign: center && "center" }}>
              {tHeader}
            </th>
          ))}
          {navLinks.map((l) => (
            <th key={l.name} />
          ))}
          {deleteUrl && <th />}
        </tr>
      </thead>
      <tbody>
        {response ? (
          shapedData.map((row) => {
            const params = { [linkParam]: row.id, ...additionalLinkParams };
            return (
              <tr key={row.id}>
                {hasBulkActions && (
                  <td>
                    <BulkAction
                      checked={selectedIds.includes(row.id)}
                      onClick={() => {
                        setSelectedIds((prev) =>
                          prev.includes(row.id)
                            ? prev.filter((i) => i !== row.id)
                            : [...prev, row.id]
                        );
                      }}
                    />
                  </td>
                )}
                {pinUrl && (
                  <td style={{ width: "3%" }}>{pinElement(row)}</td>
                )}
                {tableConfig.map(
                  ({
                    name,
                    isDropdown,
                    options = [],
                    onChange = () => {},
                    loading: dropdownLoading,
                    noTo = false,
                    type,
                    icon,
                    Component = () => <div>LOL</div>,
                    componentProps = {},
                    center,
                    ...rest
                  }) => {
                    const value = row[name];
                    const styleProps = { textAlign: center && "center" };
                    const tdPropsIfLink =
                      to && !noTo
                        ? {
                            style: { cursor: "pointer", ...styleProps },
                            onClick: () => {
                              if (to) {
                                navigate(generateLinkWithParams(to, params));
                              }
                            },
                          }
                        : {};

                    if (isDropdown) {
                      return (
                        <td
                          key={name}
                          style={{ width: "250px", ...styleProps }}
                        >
                          {dropdownLoading ? (
                            <Spinner inline />
                          ) : (
                            <Select
                              defaultValue={options.find(
                                (o) => o.value === value
                              )}
                              options={options}
                              onChange={(first) => {
                                onChange(row, first.value, reloadTable);
                              }}
                            />
                          )}
                        </td>
                      );
                    }

                    if (type === "modal") {
                      const Icon = iconObject[icon];
                      return (
                        <td key={name} style={{ width: "1%", ...styleProps }}>
                          <Icon
                            onClick={() => {
                              setModalContent(
                                <Component
                                  row={row}
                                  close={closeModal}
                                  reloadTable={reloadTable}
                                  onActionComplete={onActionComplete}
                                  {...(typeof componentProps === "function"
                                    ? componentProps(row)
                                    : componentProps)}
                                />
                              );
                            }}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={name} {...tdPropsIfLink} style={styleProps}>
                        {renderElement({
                          value,
                          ...rest,
                        })}
                      </td>
                    );
                  }
                )}
                {navLinks.map((navLink) => {
                  return (
                    <td
                      key={navLink.name}
                      style={{ width: "4%", fontSize: "1rem" }}
                    >
                      <Link to={`${navLink.link(params)}${searchParams}`}>
                        {navLink.name}
                      </Link>
                    </td>
                  );
                })}
                {deleteUrl && (
                  <td style={{ width: "3%" }}>{deleteElement(row)}</td>
                )}
              </tr>
            );
          })
        ) : (
          <tr>
            <td>
              <Spinner inline />
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export { List, Table };
