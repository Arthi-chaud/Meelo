import { Box, Grid } from "@mui/material";
import { useInfiniteQuery } from "react-query";
import LoadingComponent from "../loading/loading";
import InfiniteScroll from 'react-infinite-scroller';
import FadeIn from "react-fade-in";
import Resource from "../../models/resource";
import { PaginatedResponse } from "../../models/pagination";
import API from "../../api";

export type InfiniteFetchFn<T> = (lastPage: Page<T>) => Promise<PaginatedResponse<T>>;

type InfiniteListProps<T extends Resource> = {
	/**
	 * The method to render all the fetched items
	 */
	render: (items: T[]) => JSX.Element;
	/**
	 * Base fetching method, that return a Page of items
	 */
	fetch: InfiniteFetchFn<T>
	/**
	 * Query key of react-query
	 */
	queryKey: (string | number)[]
	/**
	 * The number to load at each query
	 */
	pageSize?: number
	/**
	 * Component to display on first load
	 */
	firstLoader: () => JSX.Element
	/**
	 * Component to display on page fetching (except first)
	 */
	loader: () => JSX.Element
}

/**
 * Data type for infinite data fetching
 */
export type Page<T> = {
	/**
	 * List of items that where fetched
	 * not including previously fetched data
	 */
	items: T[],
	/**
	 * The index of the page, usually the last page's + 1
	 */
	index: number,
	/**
	 * True if the fetching should stop there
	 */
	end: boolean,
	/**
	 * Size of the page
	 */
	pageSize: number
}

/**
 * Infinite scroll list w/ loading animation
 * @param props 
 * @returns a dynamic list component
 */
const InfiniteList = <T extends Resource,>(props: InfiniteListProps<T>) => {
	const pageSize = props.pageSize ?? API.defaultPageSize;
	const {
        isFetching,
        isError,
		isSuccess,
        data,
		hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteQuery(props.queryKey, (context) => props.fetch(context.pageParam ?? { pageSize: pageSize, index: 0 })
		.then((result) => ({
			pageSize: pageSize,
			items: result.items,
			index: result.metadata.page,
			end: result.metadata.next === null
		})), {
        getNextPageParam: (lastPage: Page<T>): Page<T> | undefined  => {
			if (lastPage.end || lastPage.items.length < pageSize)
				return undefined;
			return lastPage;
        },
		
    });
	return <>
		{ isFetching && !data && props.firstLoader() }
		<InfiniteScroll
		    pageStart={0}
		    loadMore={() => {
				if (hasNextPage && !isFetchingNextPage)
					fetchNextPage()
			}}
		    hasMore={() => hasNextPage}
		>
		{ data && props.render(data.pages.map((page) => page.items).flat()) }
		{ isFetchingNextPage && props.loader() }
		</InfiniteScroll>
	</>
}
export default InfiniteList;