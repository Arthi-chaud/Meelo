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

import Resource from "../../models/resource";
import PaginatedResponse, {
	PaginationParameters,
} from "../../models/pagination";
import { MeeloInfiniteQueryFn, useInfiniteQuery } from "../../api/use-query";
import {
	CSSProperties,
	ForwardRefExoticComponent,
	Fragment,
	ReactNode,
	RefAttributes,
	forwardRef,
	useEffect,
	useMemo,
} from "react";
import API from "../../api/api";
import { useRouter } from "next/router";
import { Components, Virtuoso } from "react-virtuoso";
import { isSSR } from "../../utils/is-ssr";

export const parentScrollableDivId = "scrollableDiv" as const;

export type InfiniteFetchFn<T> = (
	pagination: PaginationParameters,
) => Promise<PaginatedResponse<T>>;

type InfiniteScrollProps<T extends Resource> = {
	parentDiv: ForwardRefExoticComponent<
		{
			children?: ReactNode;
			firstPage?: T[];
			style?: CSSProperties;
		} & RefAttributes<HTMLDivElement>
	>;
	/**
	 * The method to render all items
	 */
	render: (item: T | undefined, index: number) => JSX.Element;
	/**
	 * Query to use
	 */
	query: MeeloInfiniteQueryFn<T>;
	/**
	 * Component to display on page fetching (except first)
	 */
	loader: () => JSX.Element;
};

//todo move to models
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
	const { data, hasNextPage, fetchNextPage, isFetchingNextPage, remove } =
		useInfiniteQuery(props.query);
	const Container: Components["List"] = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			forwardRef(({ style, ...p }, ref) => {
				const Parent = props.parentDiv;
				return (
					<Parent
						style={{ padding: 0, margin: 0, ...style }}
						firstPage={data?.pages.at(0)?.items}
						{...p}
						ref={ref}
					></Parent>
				);
			}),
		[],
	);
	const totalItemCount = useMemo(
		() =>
			data?.pages
				.map(({ items }) => items.length)
				.reduce((prev, curr) => prev + curr, 0),
		[data],
	);
	const router = useRouter();
	useEffect(() => {
		const handler = () => remove();
		router.events.on("routeChangeComplete", handler);
		return () => router.events.off("routeChangeComplete", handler);
	}, []);
	return (
		<>
			<Virtuoso
				initialItemCount={isSSR() ? totalItemCount : undefined}
				customScrollParent={
					isSSR()
						? undefined
						: document.getElementById(parentScrollableDivId) ??
							undefined
				}
				overscan={1000}
				style={{
					flex: 1,
				}}
				components={{ List: Container }}
				endReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				totalCount={totalItemCount ?? 3}
				itemContent={(index) => {
					const item = data?.pages
						.at(Math.floor(index / API.defaultPageSize))
						?.items.at(index % API.defaultPageSize);
					return props.render(item, index);
				}}
			></Virtuoso>
		</>
	);
};

export default InfiniteScroll;
