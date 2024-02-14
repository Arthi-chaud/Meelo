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

import * as IScroll from "react-infinite-scroller";
import Resource from "../../models/resource";
import PaginatedResponse, {
	PaginationParameters,
} from "../../models/pagination";
import { MeeloInfiniteQueryFn, useInfiniteQuery } from "../../api/use-query";
import { generateArray } from "../../utils/gen-list";

export type InfiniteFetchFn<T> = (
	pagination: PaginationParameters,
) => Promise<PaginatedResponse<T>>;

type InfiniteScrollProps<T extends Resource> = {
	/**
	 * The method to render all items
	 */
	render: (items: (T | undefined)[]) => JSX.Element;
	/**
	 * Query to use
	 */
	query: MeeloInfiniteQueryFn<T>;
	/**
	 * Component to display on page fetching (except first)
	 */
	loader: () => JSX.Element;
};

/**
 * Data type for infinite data fetching
 */
export type Page<T> = {
	/**
	 * List of items that where fetched
	 * not including previously fetched data
	 */
	items: T[];
	/**
	 * The id of the last items in the previous page
	 */
	afterId: number | null;
	/**
	 * True if the fetching should stop there
	 */
	end: boolean;
	/**
	 * Size of the page
	 */
	pageSize: number;
};

/**
 * Infinite scroll list w/ loading animation
 * @param props
 * @returns a dynamic list component
 */
const InfiniteScroll = <T extends Resource>(props: InfiniteScrollProps<T>) => {
	const { isFetching, data, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(props.query);

	return (
		<>
			<IScroll.default
				pageStart={0}
				loadMore={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				hasMore={hasNextPage}
				threshold={500}
			>
				{props.render(
					data === undefined
						? generateArray(5)
						: [
								...data.pages.map((page) => page.items).flat(),
								...(isFetchingNextPage ? generateArray(5) : []),
							],
				)}
			</IScroll.default>
		</>
	);
};

export default InfiniteScroll;
