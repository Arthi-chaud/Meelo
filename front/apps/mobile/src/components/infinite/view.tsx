import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import type React from "react";
import { type ComponentProps, useMemo } from "react";
import { FlatList, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { breakpoints } from "~/theme";
import "theme";
import type { LayoutOption } from "@/models/layout";
import { Divider } from "~/primitives/divider";
import { EmptyState } from "../empty-state";
import { Controls } from "./controls/component";

//TODO List: Padding after last element
//
//TODO Grid: The breakpoint's type from rt does not seem to use the type defined in the theme
//It should be typesafe
//TODO Grid: when page fetched, the item on the last line is resized + rerendered
//TODO Grid: Performance

//TODO Tap header toscroll to top

// TODO fix padding top when controls

const styles = StyleSheet.create((theme, rt) => ({
	rootStyle: { flex: 1 },
	emptyState: { height: "20%", maxHeight: 200 },
	// Note: don't know why the top of the list is not aligned with the bottom of the controls
	controls: { paddingBottom: theme.gap(1) },
	listStyle: {
		maxWidth: breakpoints.xl,
		width: "100%",
		paddingTop: theme.gap(1.5),
		paddingHorizontal: theme.gap(1),
	},
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
	controls?: Omit<ComponentProps<typeof Controls<Sort>>, "style">;
	render: (item: T1 | undefined) => React.ReactElement;
};

export const InfiniteView = <
	T extends Resource,
	T1 extends Resource,
	Sort extends string,
>(
	props: Props<T, T1, Sort>,
) => {
	styles.useVariants({ layout: props.layout });
	const queryRes = useInfiniteQuery(() => props.query);
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
	return (
		<View style={[styles.rootStyle, props.containerStyle]}>
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
					stickyHeaderIndices={props.controls ? [0] : undefined}
					ListHeaderComponent={
						props.controls ? (
							<View style={styles.controls}>
								<Controls {...props.controls} />
							</View>
						) : undefined
					}
					onEndReached={() => queryRes.fetchNextPage()}
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
