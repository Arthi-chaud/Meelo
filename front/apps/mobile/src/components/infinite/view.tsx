import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import type React from "react";
import { useMemo } from "react";
import { FlatList, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { breakpoints } from "~/theme";
import "theme";
import type { LayoutOption } from "@/models/layout";
import { Divider } from "~/primitives/divider";

//TODO List: Padding after last element
//
//TODO Grid: The breakpoint's type from rt does not seem to use the type defined in the theme
//It should be typesafe
//TODO Grid: when page fetched, the item on the last line is resized + rerendered
//TODO Grid: Performance

const styles = StyleSheet.create((theme, rt) => ({
	rootStyle: { flex: 1 },
	listStyle: {
		maxWidth: breakpoints.xl,
		width: "100%",
		paddingTop: theme.gap(1),
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

type Props<T, T1> = {
	containerStyle?: ViewStyle;
	query: InfiniteQuery<T, T1>;
	layout: LayoutOption;
	render: (item: T1 | undefined) => React.ReactElement;
};

export const InfiniteView = <T extends Resource, T1 extends Resource>(
	props: Props<T, T1>,
) => {
	styles.useVariants({ layout: props.layout });
	const queryRes = useInfiniteQuery(() => props.query);
	const itemList = useMemo(() => {
		const itemCount = queryRes.items?.length ?? 0;
		let trailingSkeletons = 0;
		if (
			(queryRes.isFetching && !itemCount) ||
			queryRes.isFetchingNextPage
		) {
			trailingSkeletons = 1;
		}

		return [
			...(queryRes.items ?? []),
			...generateArray(trailingSkeletons, undefined),
		];
	}, [queryRes.items, queryRes.isFetching, queryRes.isFetchingNextPage]);
	return (
		<View style={[styles.rootStyle, props.containerStyle]}>
			{props.layout === "list" ? (
				<FlatList
					data={itemList}
					horizontal={false}
					refreshing={queryRes.isRefetching}
					style={styles.listStyle}
					onRefresh={() => queryRes.refetch()}
					numColumns={1}
					onEndReached={() => queryRes.fetchNextPage()}
					keyExtractor={(_, idx) => {
						const item = queryRes.items?.at(idx);
						if (!item) {
							return `skeleton-${idx}`;
						}
						return `item-${item.id}`;
					}}
					renderItem={({ item }) => {
						return (
							<View style={styles.itemContainer}>
								{props.render(item)}
								<Divider h withInsets />
							</View>
						);
					}}
				/>
			) : (
				<FlatGrid
					data={itemList}
					horizontal={false}
					refreshing={queryRes.isRefetching}
					style={styles.listStyle}
					onRefresh={() => queryRes.refetch()}
					onEndReached={() => queryRes.fetchNextPage()}
					uniProps={(theme, rt) => ({
						keyExtractor: (_, idx) => {
							const item = queryRes.items?.at(idx);
							const columnCount =
								// @ts-expect-error
								theme.layout.grid.columnCount[rt.breakpoint!];
							if (!item) {
								return `skeleton-${idx}-cc:${columnCount}`;
							}
							return `item-${item.id}-cc:${columnCount}`;
						},
					})}
					renderItem={({ item }) => {
						return (
							<View style={styles.itemContainer}>
								{props.render(item as T1 | undefined)}
							</View>
						);
					}}
				/>
			)}
		</View>
	);
};

const FlatGrid = withUnistyles(FlatList, (theme, rt) => ({
	// @ts-expect-error
	numColumns: theme.layout.grid.columnCount[rt.breakpoint!],
}));
