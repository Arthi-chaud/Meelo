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
	ComponentProps,
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
import { IllustratedResource } from "../../models/illustration";
import { InfiniteData } from "react-query";
import Page from "../../models/page";
import { useGradientBackground } from "../../utils/gradient-background";
import { Divider, Grid, List } from "@mui/material";

export const parentScrollableDivId = "scrollableDiv" as const;

type InfiniteScrollProps<T extends Resource> = {
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

const getItem = <T,>(
	index: number,
	data: InfiniteData<Page<T>> | undefined,
) => {
	const item = data?.pages
		.at(Math.floor(index / API.defaultPageSize))
		?.items.at(index % API.defaultPageSize);
	return item;
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
				return (
					<div
						style={{ padding: 0, margin: 0, ...style }}
						{...p}
						ref={ref}
					></div>
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
	//TODO Try to remove
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
					return props.render(getItem(index, data), index);
				}}
			></Virtuoso>
		</>
	);
};

const InfiniteList = <T extends IllustratedResource>(
	props: InfiniteScrollProps<T>,
) => {
	const { data, hasNextPage, fetchNextPage, isFetchingNextPage, remove } =
		useInfiniteQuery(props.query);
	const totalItemCount = useMemo(
		() =>
			data?.pages
				.map(({ items }) => items.length)
				.reduce((prev, curr) => prev + curr, 0),
		[data],
	);

	const Container: Components["List"] = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			forwardRef(({ style, ...p }, ref) => {
				return (
					<List
						style={{ padding: 0, ...style, margin: 0 }}
						component="div"
						{...p}
						ref={ref}
					></List>
				);
			}),
		[],
	);
	const { GradientBackground } = useGradientBackground(
		data?.pages.at(0)?.items?.find((x) => x.illustration)?.illustration
			?.colors,
	);

	return (
		<>
			<GradientBackground />
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
					height: "100%",
				}}
				components={{ List: Container }}
				endReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				totalCount={totalItemCount ?? 3}
				itemContent={(index) => {
					return (
						<Fragment key={`list-item-${index}`}>
							{props.render(getItem(index, data), index)}
							<Divider variant="middle" />
						</Fragment>
					);
				}}
			></Virtuoso>
		</>
	);
};

const InfiniteGrid = <T extends IllustratedResource>(
	props: InfiniteScrollProps<T>,
) => {
	const { data, hasNextPage, fetchNextPage, isFetchingNextPage, remove } =
		useInfiniteQuery(props.query);
	const totalItemCount = useMemo(
		() =>
			data?.pages
				.map(({ items }) => items.length)
				.reduce((prev, curr) => prev + curr, 0),
		[data],
	);

	const Container: Components["List"] = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			forwardRef(({ style, children, ...p }, ref) => {
				return (
					<Grid
						ref={ref}
						columnSpacing={2}
						container
						component="div"
						style={{
							...style,
							alignItems: "stretch",
							display: "flex",
						}}
						{...p}
					>
						{children}
					</Grid>
				);
			}),
		[],
	);
	const Item: Components["Item"] = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			({ children, ...props }) => {
				return (
					<Grid
						{...props}
						item
						xs={6}
						sm={3}
						md={12 / 5}
						lg={2}
						xl={1.2}
					>
						{children}
					</Grid>
				);
			},
		[],
	);
	const { GradientBackground } = useGradientBackground(
		data?.pages.at(0)?.items?.find((x) => x.illustration)?.illustration
			?.colors,
	);

	return (
		<>
			<GradientBackground />
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
					height: "100%",
				}}
				components={{ List: Container, Item }}
				endReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage();
					}
				}}
				totalCount={totalItemCount ?? 3}
				itemContent={(index) =>
					props.render(getItem(index, data), index)
				}
			></Virtuoso>
		</>
	);
};

export default InfiniteScroll;
export { InfiniteList, InfiniteGrid };
