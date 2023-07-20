import { useFilters, usePagination } from "common/components";
import { useEffect } from "react";

const useFiltersAndPagination = ({
  total,
  filterConfig,
  recallFunction = () => {},
}) => {
  const { paginationComponent, limit, skip, setSkip } = usePagination({
    total,
  });

  const { filters, filtersComponent } = useFilters({
    filterConfig,
    recallFunction: () => setSkip(0),
  });

  useEffect(() => {
    recallFunction({ limit, skip, filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, skip, filters]);

  return {
    paginationComponent,
    filtersComponent,
    limit,
    skip,
    setSkip,
    filters,
  };
};

export default useFiltersAndPagination;
