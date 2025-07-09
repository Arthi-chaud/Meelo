import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import type React from "react";
import { type ComponentProps, useMemo, useState } from "react";
import { FlatList, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { breakpoints } from "~/theme";
import "theme";
import type { IllustratedResource } from "@/models/illustration";
import type { LayoutOption } from "@/models/layout";
import { Divider } from "~/primitives/divider";
import { useSetKeyIllustrationFromInfiniteQuery } from "../background-gradient";
import { EmptyState } from "../empty-state";
import { Controls } from "./controls/component";

//TODO List: Padding after last element
//
//TODO Grid: The breakpoint's type from rt does not seem to use the type defined in the theme
//It should be typesafe
//TODO Grid: when page fetched, the item on the last line is resized + rerendered
//TODO Grid: Performance

//TODO Tap header toscroll to top

const styles = StyleSheet.create((theme, rt) => ({
	rootStyle: { flex: 1, position: "relative" },
	emptyState: { height: "20%", maxHeight: 200 },
	controls: {
		paddingVertical: theme.gap(1.5),
		paddingHorizontal: theme.gap(1),
		position: "absolute",
		zIndex: 1,
		width: "100%",
	},
	listStyle: {
		maxWidth: breakpoints.xl,
		width: "100%",
		paddingHorizontal: theme.gap(1),
	},

	//approximate so that the list start below controls
	//putting the actual controls in the ListHeaderComponent causes the dropdown to be misplaced
	listHeader: (controlsHeight: number | null) => ({
		height: controlsHeight == null ? theme.gap(8.25) : controlsHeight,
	}),
	itemContainer: {
		variants: {
			layout: {
				grid: {
					// @ts-expect-error
					width: `${100 / theme.layout.grid.columnCount[rt.breakpoint!]}%`,
				},
				list: {},
			},
		},
	},
}));

type Props<T, T1, Sort extends string> = {
	containerStyle?: ViewStyle;
	query: InfiniteQuery<T, T1>;
	layout: LayoutOption;
	controls: Omit<ComponentProps<typeof Controls<Sort>>, "style">;
	render: (item: T1 | undefined) => React.ReactElement;
};

export const InfiniteView = <
	T extends Resource,
	T1 extends IllustratedResource,
	Sort extends string,
>(
	props: Props<T, T1, Sort>,
) => {
	styles.useVariants({ layout: props.layout });
	const queryRes = useInfiniteQuery(() => props.query);
	const [controlsHeight, setControlsHeight] = useState(null as number | null);
	const firstPage = queryRes.data?.pages.at(0)?.items;
	const itemList = useMemo(() => {
		const itemCount = queryRes.items?.length ?? 0;
		const trailingSkeletons =
			(queryRes.isFetching && !itemCount) || queryRes.isFetchingNextPage
				? 1
				: 0;

		return [
			...(queryRes.items ?? []),
			...generateArray(trailingSkeletons, undefined),
		];
	}, [queryRes.items, queryRes.isFetching, queryRes.isFetchingNextPage]);
	const ScrollView = props.layout === "list" ? FlatList : FlatGrid;
	useSetKeyIllustrationFromInfiniteQuery(props.query);
	return (
		<View style={[styles.rootStyle, props.containerStyle]}>
			<View
				style={styles.controls}
				onLayout={(e) => setControlsHeight(e.nativeEvent.layout.height)}
			>
				<Controls {...props.controls} />
			</View>
			{firstPage?.length === 0 ? (
				<View style={styles.emptyState}>
					<EmptyState />
				</View>
			) : (
				<ScrollView
					data={itemList}
					refreshing={queryRes.isRefetching}
					style={styles.listStyle}
					onRefresh={() => queryRes.refetch()}
					onEndReached={() => queryRes.fetchNextPage()}
					stickyHeaderIndices={[0]}
					stickyHeaderHiddenOnScroll
					ListHeaderComponent={
						<View style={styles.listHeader(controlsHeight)} />
					}
					renderItem={({ item }) => {
						return (
							<View style={styles.itemContainer}>
								{props.render(item as T1 | undefined)}
							</View>
						);
					}}
					{...(props.layout === "grid"
						? {
								uniProps: (theme, rt) => ({
									keyExtractor: (_, idx) => {
										const item = queryRes.items?.at(idx);
										const columnCount =
											// @ts-expect-error
											theme.layout.grid.columnCount[
												rt.breakpoint!
											];
										if (!item) {
											return `skeleton-${idx}-cc:${columnCount}`;
										}
										return `item-${item.id}-cc:${columnCount}`;
									},
								}),
							}
						: {
								numColumns: 1,
								ItemSeparatorComponent: () => (
									<Divider h withInsets />
								),
								keyExtractor: (_, idx) => {
									const item = queryRes.items?.at(idx);
									if (!item) {
										return `skeleton-${idx}`;
									}
									return `item-${item.id}`;
								},
							})}
				/>
			)}
		</View>
	);
};

const FlatGrid = withUnistyles(FlatList, (theme, rt) => ({
	// @ts-expect-error
	numColumns: theme.layout.grid.columnCount[rt.breakpoint!],
}));
