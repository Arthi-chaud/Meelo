import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { MeeloInfiniteQueryFn, useInfiniteQuery } from "../api/use-query";
import Resource from "../models/resource";

type AdminGridProps<DataType extends Resource> = {
	infiniteQuery: MeeloInfiniteQueryFn<DataType>;
	columns: GridColDef<DataType>[];
};

/**
 * Wrapping if MUI's Data grid from administrative panels, like user and libraries management
 */
const AdminGrid = <DataType extends Resource>({
	infiniteQuery,
	columns,
}: AdminGridProps<DataType>) => {
	const {
		data,
		hasNextPage,
		hasPreviousPage,
		fetchNextPage,
		fetchPreviousPage,
	} = useInfiniteQuery(infiniteQuery);
	const [currentPage, setCurrentPage] = useState(0);
	const itemsCount = useMemo(
		() =>
			data?.pages
				.map((page) => page.items.length)
				.reduce((pageSize, sum) => pageSize + sum, 0) ?? 0,
		[data?.pages],
	);

	useEffect(() => {
		hasNextPage && fetchNextPage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasNextPage]);
	return (
		<DataGrid
			loading={data?.pages[currentPage] == undefined}
			rows={data?.pages[currentPage]?.items ?? []}
			rowCount={itemsCount}
			pageSize={API.defaultPageSize}
			rowsPerPageOptions={[API.defaultPageSize]}
			page={currentPage}
			disableColumnSelector
			disableColumnMenu
			disableSelectionOnClick
			paginationMode="server"
			autoHeight
			onPageChange={(page) => {
				if (page == currentPage + 1 && hasNextPage) {
					fetchNextPage();
				} else if (page == currentPage - 1 && hasPreviousPage) {
					fetchPreviousPage();
				}
				setCurrentPage(page);
			}}
			columns={columns.map((column) => ({
				...column,
				sortable: false,
			}))}
		/>
	);
};

export default AdminGrid;
