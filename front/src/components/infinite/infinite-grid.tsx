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

import { Grid } from "@mui/material";
import Resource from "../../models/resource";
import InfiniteScroll, { parentScrollableDivId } from "./infinite-scroll";
import { IllustratedResource } from "../../models/illustration";
import { useGradientBackground } from "../../utils/gradient-background";
import { forwardRef, Fragment, useMemo, useState } from "react";
import { useInfiniteQuery } from "../../api/use-query";
import { GridComponents, VirtuosoGrid } from "react-virtuoso";
import API from "../../api/api";

type TypedList<T extends Resource> = typeof InfiniteScroll<T>;
type InfiniteGridProps<T extends Resource> = Omit<
	Parameters<TypedList<T>>[0],
	"render"
> & { render: (item: T | undefined, index: number) => JSX.Element };

/**
 * Infinite Scrolling List
 * @param props
 * @returns
 */
const InfiniteGrid = <T extends IllustratedResource>(
	props: InfiniteGridProps<T>,
) => {
	const { isFetching, data, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(props.query);
	const { GradientBackground } = useGradientBackground(
		data?.pages.at(0)?.items.at(0)?.illustration?.colors,
		-1,
	);
	const components = useMemo(
		(): GridComponents => ({
			// eslint-disable-next-line react/display-name
			List: forwardRef(({ style, children, ...otherProps }, ref) => (
				<Grid
					component="div"
					ref={ref}
					{...otherProps}
					container
					sx={{
						alignItems: "stretch",
						display: "flex",
					}}
					style={style}
				>
					{children}
				</Grid>
			)),
			Item: ({ children, ...itemProps }) => (
				<Grid
					item
					{...itemProps}
					xs={6}
					sm={3}
					md={12 / 5}
					lg={2}
					xl={1.2}
					sx={{ paddingX: 1 }}
				>
					{children}
				</Grid>
			),
		}),
		[],
	);
	return (
		<>
			<GradientBackground />
			<VirtuosoGrid
				components={components}
				customScrollParent={
					typeof document === "undefined"
						? undefined
						: document.getElementById(parentScrollableDivId) ??
							undefined
				}
				initialItemCount={
					data?.pages.map((page) => page.items).flat().length ?? 0
				}
				style={{ flex: 1 }}
				overscan={200}
				totalCount={
					data?.pages.map((page) => page.items).flat().length ?? 3
				}
				endReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				itemContent={(index) => {
					const item = data?.pages
						.at(Math.floor(index / API.defaultPageSize))
						?.items.at(index % API.defaultPageSize);
					return (
						<Fragment key={item?.id ?? `skeleton-${index}`}>
							{props.render(item, index)}
						</Fragment>
					);
				}}
			/>
		</>
	);
};

export default InfiniteGrid;
