import { Box } from "@mui/material";
import { useInfiniteQuery } from "react-query";
import LoadingComponent from "./loading";
import InfiniteScroll from 'react-infinite-scroller';
import FadeIn from "react-fade-in";

const defaultPageSize = 30;

type InfiniteListProps<T> = {
	/**
	 * The method to render all the fetched items
	 */
	render: (items: T[]) => JSX.Element;
	/**
	 * Base fetching method, that return a Page of items
	 */
	fetch: (lastPage: Page<T> | undefined, pageSize: number) => Promise<Page<T>>,
	/**
	 * Query key of react-query
	 */
	queryKey: string[],
	/**
	 * The number to load at each query
	 */
	pageSize?: number
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
	end: boolean
}


const InfiniteList = <T,>(props: InfiniteListProps<T>) => {
	const pageSize = props.pageSize ?? defaultPageSize;
	const {
        isFetching,
        isError,
		isSuccess,
        data,
		hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteQuery(props.queryKey, (context) => props.fetch(context.pageParam, pageSize), {
        getNextPageParam: (lastPage: Page<T>): Page<T> | undefined  => {
			if (lastPage.end || lastPage.items.length < pageSize)
				return undefined;
			return lastPage;
        },
		
    })
	return <>
		{ (isFetching && data?.pages.length == 0) &&
			<Box width='100%' display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
				<LoadingComponent />
			</Box>
		}
		<InfiniteScroll
		    pageStart={0}
		    loadMore={() => {
				if (hasNextPage && !isFetchingNextPage)
					fetchNextPage()
			}}
		    hasMore={() => hasNextPage}
		>
		{ isSuccess && props.render(data.pages.map((page) => page.items).flat()) }
		{ isFetchingNextPage && 
			<FadeIn>
				<Box width='100%' display="flex" justifyContent="center" paddingY={10}>
					<LoadingComponent/>
				</Box>
			</FadeIn>
		}
		</InfiniteScroll>
	</>
}

export default InfiniteList;