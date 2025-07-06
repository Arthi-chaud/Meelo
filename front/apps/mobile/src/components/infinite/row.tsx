import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import type React from "react";
import { createRef, useMemo } from "react";
import { FlatList, TouchableOpacity, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { LoadableText } from "~/components/loadable_text";

type Props<T0, T> = {
	query: InfiniteQuery<T0, T>;
	header: string;
	style?: ViewStyle;
	render: (item: T | undefined) => React.ReactElement;
};

export const InfiniteRow = <T0 extends Resource, T extends Resource>({
	query,
	header,
	render,
	style,
}: Props<T0, T>) => {
	const flatListRef = createRef<FlatList<unknown>>();
	const { items, isFetching, isFetchingNextPage, fetchNextPage } =
		useInfiniteQuery(() => query);

	const itemList = useMemo(() => {
		const itemCount = items?.length ?? 0;
		if ((isFetching && !itemCount) || isFetchingNextPage) {
			return [...(items ?? []), undefined];
		}
		return items ?? [undefined];
	}, [items, isFetching, isFetchingNextPage]);
	return (
		<View style={[styles.root, style]}>
			<TouchableOpacity
				touchSoundDisabled
				style={styles.header}
				onPress={() =>
					flatListRef.current?.scrollToIndex({
						animated: true,
						index: 0,
					})
				}
			>
				<LoadableText
					variant="h4"
					skeletonWidth={header.length}
					content={items === undefined ? undefined : header}
				/>
			</TouchableOpacity>
			<ResponsiveFlatList
				horizontal
				ref={flatListRef}
				data={itemList}
				contentContainerStyle={styles.row}
				onEndReached={() => fetchNextPage()}
				renderItem={({ item, index }) => {
					return (
						<View style={[styles.item(index)]}>
							{render(item as T | undefined)}
						</View>
					);
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: { display: "flex", alignItems: "flex-start" },
	header: {
		marginLeft: theme.gap(1),
		paddingHorizontal: theme.gap(1),
		marginBottom: theme.gap(1),
		borderRadius: theme.borderRadius,
		overflow: "hidden",
	},
	row: { gap: theme.gap(0.5) },
	item: (itemIndex: number) => ({
		marginLeft: itemIndex === 0 ? theme.gap(1) : 0,
		// @ts-expect-error
		//TODO See Grid
		width: rt.screen.width / theme.layout.grid.columnCount[rt.breakpoint!],
	}),
}));

const ResponsiveFlatList = withUnistyles(FlatList, (theme, rt) => ({
	// @ts-expect-error
	initialNumToRender: theme.layout.grid.columnCount[rt.breakpoint!],
}));
