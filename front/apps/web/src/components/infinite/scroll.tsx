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

import type { ReactNode } from "react";
import * as IScroll from "react-infinite-scroller";
import type { InfiniteQueryFn } from "@/api/query";
import type Resource from "@/models/resource";
import { EmptyStateIcon } from "@/ui/icons";
import { ParentScrollableDivId } from "@/utils/constants";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery } from "~/api";
import { EmptyState, type EmptyStateProps } from "~/components/empty-state";

type InfiniteScrollProps<T extends Resource, F extends Resource> = {
	/**
	 * The method to render all items
	 */
	render: (items: (F | undefined)[]) => ReactNode;
	/**
	 * Query to use
	 */
	query: InfiniteQueryFn<T, F>;

	nested?: true;
	emptyState?: EmptyStateProps;
};

/**
 * Infinite scroll list w/ loading animation
 * @param props
 * @returns a dynamic list component
 */
const InfiniteScroll = <T extends Resource, F extends Resource>(
	props: InfiniteScrollProps<T, F>,
) => {
	const { items, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(props.query);
	return (
		<>
			{items?.length === 0 && (
				<EmptyState
					icon={props.emptyState?.icon ?? <EmptyStateIcon />}
					text={props.emptyState?.text ?? "emptyState.default"}
					actions={props.emptyState?.actions ?? []}
				/>
			)}
			<IScroll.default
				pageStart={0}
				loadMore={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				getScrollParent={
					props.nested
						? undefined
						: () => document.getElementById(ParentScrollableDivId)
				}
				useWindow={false}
				hasMore={hasNextPage}
				threshold={500}
			>
				{props.render(
					items === undefined
						? generateArray(3)
						: [
								...items,
								...(isFetchingNextPage ? generateArray(3) : []),
							],
				)}
			</IScroll.default>
		</>
	);
};

export default InfiniteScroll;
