/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import type { InfiniteQueryFn } from "@/api/query";
import type Resource from "@/models/resource";
import { useAPI, useInfiniteQuery } from "~/api";

type AdminGridProps<DataType extends Resource> = {
	infiniteQuery: InfiniteQueryFn<DataType>;
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
		items,
		hasNextPage,
		hasPreviousPage,
		fetchNextPage,
		fetchPreviousPage,
	} = useInfiniteQuery(infiniteQuery);
	const api = useAPI();
	const [currentPage, setCurrentPage] = useState(0);
	const itemsCount = useMemo(() => items?.length, [items]);

	useEffect(() => {
		hasNextPage && fetchNextPage();
	}, [hasNextPage]);
	return (
		<DataGrid
			loading={data?.pages.at(currentPage) === undefined}
			rows={data?.pages[currentPage]?.items ?? []}
			rowCount={itemsCount}
			paginationModel={{
				pageSize: api.pageSize,
				page: currentPage,
			}}
			pageSizeOptions={[api.pageSize]}
			disableColumnSelector
			disableRowSelectionOnClick
			disableColumnMenu
			paginationMode="server"
			onPaginationModelChange={({ page }) => {
				if (page === currentPage + 1 && hasNextPage) {
					fetchNextPage();
				} else if (page === currentPage - 1 && hasPreviousPage) {
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
