import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
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

//TODO Focus header: border radius + width

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
		let trailingSkeletons = 0;
		if ((isFetching && !itemCount) || isFetchingNextPage) {
			trailingSkeletons = 1;
		}
		return generateArray(itemCount + trailingSkeletons, undefined);
	}, [items, isFetching, isFetchingNextPage]);
	return (
		<View style={[styles.root, style]}>
			<TouchableOpacity
				touchSoundDisabled
				//focusable={false} // TODO Doesn't work?
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
				renderItem={({ index }) => {
					const item = items?.at(index);
					return (
						<View style={[styles.item(index)]}>{render(item)}</View>
					);
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: { display: "flex", alignItems: "flex-start" },
	header: {
		marginLeft: theme.gap(2),
		marginBottom: theme.gap(1),
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
