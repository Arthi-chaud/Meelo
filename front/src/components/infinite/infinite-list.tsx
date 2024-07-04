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

import { Divider } from "@mui/material";
import Resource from "../../models/resource";
import InfiniteScroll, { parentScrollableDivId } from "./infinite-scroll";
import { Fragment, useMemo, useState } from "react";
import { IllustratedResource } from "../../models/illustration";
import { useGradientBackground } from "../../utils/gradient-background";
import { Virtuoso } from "react-virtuoso";
import { useInfiniteQuery } from "../../api/use-query";

type TypedList<T extends Resource> = typeof InfiniteScroll<T>;
type InfiniteListProps<T extends Resource> = Omit<
	Parameters<TypedList<T>>[0],
	"render"
> & { render: (item: T | undefined, index: number) => JSX.Element };

/**
 * Similar to InfiniteGrid, but rendered as a list
 * @param props
 * @returns
 */
const InfiniteList = <T extends IllustratedResource>(
	props: InfiniteListProps<T>,
) => {
	const [firstItem, setFirstItem] = useState<T>();
	const { GradientBackground } = useGradientBackground(
		firstItem?.illustration?.colors,
		-1,
	);
	const { isFetching, data, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(props.query);
	const { itemsCount, items } = useMemo(() => {
		const flattened = data?.pages.map((page) => page.items).flat();
		return { itemsCount: flattened?.length, items: flattened };
	}, [data]);

	return (
		<>
			<GradientBackground />
			<Virtuoso
				overscan={300}
				customScrollParent={
					typeof document === "undefined"
						? undefined
						: document.getElementById(parentScrollableDivId) ??
							undefined
				}
				increaseViewportBy={35}
				totalCount={itemsCount ?? 3}
				endReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				itemContent={(index) => {
					const item = items?.at(index);
					if (!firstItem) {
						setFirstItem(item);
					}
					return (
						<Fragment key={item?.id ?? `skeleton-${index}`}>
							{props.render(item, index)}
							<Divider variant="middle" />
						</Fragment>
					);
				}}
			/>
		</>
	);
};

export default InfiniteList;
