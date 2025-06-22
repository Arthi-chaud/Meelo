import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import type React from "react";
import { useMemo } from "react";
import { FlatList, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";

const styles = StyleSheet.create((theme) => ({
	rootStyle: { flex: 1, marginHorizontal: theme.gap(1) },
	itemContainer: (columnCount: number) => ({
		width: `${100 / columnCount}%`,
	}),
}));

type Props<T, T1> = {
	containerStyle?: ViewStyle;
	query: InfiniteQuery<T, T1>;
	render: (item: T1 | undefined) => React.ReactElement;
};

export const InfiniteGrid = <T extends Resource, T1 extends Resource>(
	props: Props<T, T1>,
) => {
	const columnCount = 3;
	const queryRes = useInfiniteQuery(() => props.query);
	const itemList = useMemo(() => {
		const itemCount = queryRes.items?.length ?? 0;
		let trailingSkeletons = 0;
		if (queryRes.isFetching && !itemCount) {
			trailingSkeletons = columnCount;
		} else if (queryRes.isFetchingNextPage) {
			trailingSkeletons =
				columnCount - (itemCount % columnCount) || columnCount;
		}
		return generateArray(itemCount + trailingSkeletons, null);
	}, [
		columnCount,
		queryRes.items,
		queryRes.isFetching,
		queryRes.isFetchingNextPage,
	]);
	return (
		<View style={[styles.rootStyle, props.containerStyle]}>
			<FlatList
				data={itemList}
				numColumns={columnCount}
				horizontal={false}
				keyExtractor={(_, idx) => {
					const item = queryRes.items?.at(idx);
					return item?.id.toString() ?? `skeleton-${idx}`;
				}}
				refreshing={queryRes.isRefetching}
				onRefresh={() => queryRes.refetch()}
				onEndReached={() => queryRes.fetchNextPage()}
				renderItem={({ index }) => {
					const item = queryRes.items?.at(index);
					return (
						<View style={styles.itemContainer(columnCount)}>
							{props.render(item)}
						</View>
					);
				}}
			/>
		</View>
	);
};
