import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import type React from "react";
import { useMemo } from "react";
import { FlatList, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";

const styles = StyleSheet.create((theme) => ({
	rootStyle: { flex: 1, paddingHorizontal: theme.gap(1) },
	itemContainer: { flex: 1, gap: theme.gap(0.5) },
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
		let trailingItems: (null | undefined)[] = [];
		if (queryRes.isFetching && !itemCount) {
			trailingItems = generateArray(columnCount, undefined);
		} else if (queryRes.isFetchingNextPage) {
			trailingItems = generateArray(
				columnCount - (itemCount % columnCount) || columnCount,
				undefined,
			);
		} else {
			const emptyPlaceholderCount =
				columnCount - (itemCount % columnCount);
			trailingItems = generateArray(emptyPlaceholderCount, null);
		}
		return [...(queryRes.items ?? []), ...trailingItems];
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
				keyExtractor={(item, idx) =>
					item?.id?.toString() ?? `skeleton-${idx}`
				}
				refreshing={queryRes.isRefetching}
				onRefresh={() => queryRes.refetch()}
				onEndReached={() => queryRes.fetchNextPage()}
				renderItem={({ item }) => {
					//TODO Optimise, avoid rerender at every page
					return (
						<View style={styles.itemContainer}>
							{item === null ? undefined : props.render(item)}
						</View>
					);
				}}
			/>
		</View>
	);
};
