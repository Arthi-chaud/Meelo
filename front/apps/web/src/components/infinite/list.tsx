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

import { LegendList } from "@legendapp/list/react";
import { Divider } from "@mui/material";
import { Fragment, type ReactNode, useMemo, useRef } from "react";
import type { IllustratedResource } from "@/models/illustration";
import type Resource from "@/models/resource";
import { EmptyStateIcon } from "@/ui/icons";
import { ParentScrollableDivId } from "@/utils/constants";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery } from "~/api";
import { useGradientBackground } from "~/components/gradient-background";
import { EmptyState } from "../empty-state";
import type InfiniteScroll from "./scroll";

type TypedList<
	T extends Resource,
	F extends Resource = T,
> = typeof InfiniteScroll<T, F>;
type InfiniteListProps<T extends Resource, F extends Resource = T> = Omit<
	Parameters<TypedList<T, F>>[0],
	"render"
> & {
	render: (
		item: F | undefined,
		items: (F | undefined)[],
		index: number,
	) => ReactNode;
} & Partial<Pick<Parameters<TypedList<T, F>>[0], "emptyState">>;

const positions = new Map<string, { index: number }>();

/**
 * Similar to InfiniteGrid, but rendered as a list
 * @param props
 * @returns
 */
const InfiniteList = <T extends Resource, F extends IllustratedResource>(
	props: InfiniteListProps<T, F>,
) => {
	const entryKey = useRef<string | undefined>(
		typeof window !== "undefined" ? window.history.state?.key : undefined,
	).current;

	const saved = useRef(
		entryKey ? positions.get(entryKey) : undefined,
	).current;
	const { items, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(props.query);

	const { GradientBackground } = useGradientBackground(
		items?.find((item) => item?.illustration !== undefined)?.illustration
			?.colors,
		-1,
	);
	const data: (F | undefined)[] = useMemo(() => {
		if (items === undefined) {
			return generateArray(3);
		}
		if (isFetchingNextPage) {
			return [...items, ...generateArray(3)];
		}
		return items;
	}, [items, isFetchingNextPage]);

	return (
		<>
			<GradientBackground />
			{items?.length === 0 && (
				<EmptyState
					icon={props.emptyState?.icon ?? <EmptyStateIcon />}
					text={props.emptyState?.text ?? "emptyState.default"}
					actions={props.emptyState?.actions ?? []}
				/>
			)}
			{typeof window === "undefined" ? (
				<>
					{generateArray(3).map((_, i) => (
						<Fragment key={i}>
							{props.render(undefined, [], i)}
							<Divider variant="middle" />
						</Fragment>
					))}
				</>
			) : (
				<LegendList
					style={{ flex: 1 }}
					data={data}
					initialScrollIndex={
						saved ? { index: saved.index } : undefined
					}
					scrollElement={
						props.nested
							? undefined
							: typeof document === "undefined"
								? undefined
								: document.getElementById(ParentScrollableDivId)
					}
					keyExtractor={(i, idx) =>
						i !== undefined ? i.id.toString() : `skeleton-${idx}`
					}
					onFirstVisibleItemChanged={({ index }) => {
						if (entryKey) positions.set(entryKey, { index });
					}}
					maintainVisibleContentPosition
					recycleItems
					renderItem={({ item, index }) =>
						props.render(item, data, index)
					}
					onEndReached={hasNextPage ? () => fetchNextPage() : null}
					ItemSeparatorComponent={() => <Divider variant="middle" />}
				/>
			)}
		</>
	);
};

export default InfiniteList;
