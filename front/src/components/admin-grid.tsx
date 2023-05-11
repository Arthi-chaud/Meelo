import {
	DataGrid, GridColDef, GridValidRowModel
} from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import API from "../api/api";
import { MeeloInfiniteQueryFn, useInfiniteQuery } from "../api/use-query";
import Translate from "../i18n/translate";

type AdminGridProps<DataType extends GridValidRowModel> = {
	infiniteQuery: MeeloInfiniteQueryFn<DataType>;
	columns: GridColDef<DataType>[];
}

/**
 * Wrapping if MUI's Data grid from administrative panels, like user and libraries management
 */
const AdminGrid = <DataType extends GridValidRowModel>(
	{ infiniteQuery, columns }: AdminGridProps<DataType>
) => {
	const {
		data, hasNextPage, hasPreviousPage,
		fetchNextPage, fetchPreviousPage
	} = useInfiniteQuery(infiniteQuery);
	const [currentPage, setCurrentPage] = useState(0);
	const [itemsCount, setItemsCount] = useState(0);

	useEffect(() => {
		hasNextPage && fetchNextPage();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasNextPage]);
	useEffect(() => {
		setItemsCount(data?.pages
			.map((page) => page.items.length)
			.reduce((pageSize, sum) => pageSize + sum, 0) ?? 0);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data?.pages]);
	return <DataGrid
		loading={data?.pages[currentPage] == undefined}
		rows={data?.pages[currentPage]?.items ?? []}
		rowCount={itemsCount}
		pageSize={API.defaultPageSize}
		rowsPerPageOptions={[API.defaultPageSize]}
		page={currentPage}
		disableColumnSelector
		disableColumnMenu
		disableSelectionOnClick
		paginationMode='server'
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
	/>;
};

export default AdminGrid;
