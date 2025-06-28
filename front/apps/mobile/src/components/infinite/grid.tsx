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

//TODO The breakpoint's type from rt does not seem to use the type defined in the theme
//It should be typesafe

//TODO when page fetched, the item on the last line is resized + rerendered
//TODO Performance

const styles = StyleSheet.create((theme, rt) => ({
	rootStyle: { flex: 1, marginHorizontal: theme.gap(1) },
	listStyle: { maxWidth: breakpoints.xl, width: "100%" },
	itemContainer: {
		// @ts-expect-error
		width: `${100 / theme.layout.grid.columnCount[rt.breakpoint!]}%`,
	},
}));

type Props<T, T1> = {
	containerStyle?: ViewStyle;
	query: InfiniteQuery<T, T1>;
	render: (item: T1 | undefined) => React.ReactElement;
};

export const InfiniteGrid = <T extends Resource, T1 extends Resource>(
	props: Props<T, T1>,
) => {
	const queryRes = useInfiniteQuery(() => props.query);
	const itemList = useMemo(() => {
		const itemCount = queryRes.items?.length ?? 0;
		let trailingSkeletons = 0;
		if (queryRes.isFetching && !itemCount) {
			trailingSkeletons = 1;
		} else if (queryRes.isFetchingNextPage) {
			trailingSkeletons = 1;
		}
		return generateArray(itemCount + trailingSkeletons, null);
	}, [queryRes.items, queryRes.isFetching, queryRes.isFetchingNextPage]);
	return (
		<View style={[styles.rootStyle, props.containerStyle]}>
			<ResponsiveFlatList
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
				renderItem={({ index }) => {
					const item = queryRes.items?.at(index);
					return (
						<View style={styles.itemContainer}>
							{props.render(item)}
						</View>
					);
				}}
			/>
		</View>
	);
};

const ResponsiveFlatList = withUnistyles(FlatList, (theme, rt) => ({
	// @ts-expect-error
	numColumns: theme.layout.grid.columnCount[rt.breakpoint!],
}));
