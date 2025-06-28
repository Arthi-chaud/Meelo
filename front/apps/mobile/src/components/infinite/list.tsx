import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import type React from "react";
import { useMemo } from "react";
import { FlatList, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { breakpoints } from "~/theme";
import "theme";

const styles = StyleSheet.create((theme) => ({
	rootStyle: { flex: 1, marginHorizontal: theme.gap(1) },
	listStyle: { maxWidth: breakpoints.xl, width: "100%" },
	itemContainer: {},
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
		if (
			(queryRes.isFetching && !itemCount) ||
			queryRes.isFetchingNextPage
		) {
			trailingSkeletons = 1;
		}
		return generateArray(itemCount + trailingSkeletons, null);
	}, [queryRes.items, queryRes.isFetching, queryRes.isFetchingNextPage]);
	return (
		<View style={[styles.rootStyle, props.containerStyle]}>
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
