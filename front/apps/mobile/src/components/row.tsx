import { FlashList, type FlashListRef } from "@shopify/flash-list";
import type { Href } from "expo-router";
import type React from "react";
import { createRef, useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type Resource from "@/models/resource";
import { EmptyState } from "~/components/empty-state";
import { SectionHeader } from "./section-header";

export type RowProps<T> = {
	items?: (T | undefined)[];
	header?: string;
	style?: ViewStyle;
	seeMore?: Href;
	render: (item: T | undefined) => React.ReactElement;
	onEndReached?: () => void;
	hideIfEmpty?: true;
};

export const Row = <T extends Resource>({ items, ...props }: RowProps<T>) => {
	const itemList = useMemo(() => {
		return items ?? [undefined];
	}, [items]);

	return <RowBase {...props} items={itemList} />;
};

const RowBase = <T extends Resource>({
	items,
	header,
	hideIfEmpty,
	style,
	render,
	onEndReached,
	seeMore,
}: RowProps<T>) => {
	const flatListRef = createRef<FlashListRef<unknown>>();
	return (
		(!hideIfEmpty || (items && items.length > 0)) && (
			<View style={[styles.root, style]}>
				{header && (
					<SectionHeader
						seeMore={seeMore}
						onPress={() =>
							flatListRef.current?.scrollToIndex({
								animated: true,
								index: 0,
							})
						}
						skeletonWidth={header.length}
						content={
							items === undefined || items[0] === undefined
								? undefined
								: header
						}
					/>
				)}
				{items?.length !== 0 ? (
					<ResponsiveFlashList
						data={items}
						horizontal
						contentContainerStyle={styles.row}
						onEndReached={onEndReached}
						ref={flatListRef}
						snapToAlignment="start"
						keyExtractor={(item, idx) =>
							item ? `item-${(item as T).id}` : `skeleton-${idx}`
						}
						renderItem={({ item, index }) => {
							return (
								<View style={styles.item(index)}>
									{render(item as T | undefined)}
								</View>
							);
						}}
					/>
				) : (
					<View style={styles.emptyState}>
						<EmptyState />
					</View>
				)}
			</View>
		)
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: { width: "100%" },
	emptyState: {
		aspectRatio: 2.5, // TODO this an approximate, would be nice to compute this correctly
		width: "100%",
	},
	row: { gap: theme.gap(0.5), paddingRight: theme.gap(1) },
	item: (itemIndex: number) => ({
		marginLeft: itemIndex === 0 ? theme.gap(1) : 0,
		// @ts-expect-error
		width: rt.screen.width / theme.layout.grid.columnCount[rt.breakpoint!],
	}),
}));

const ResponsiveFlashList = withUnistyles(FlashList, (theme, rt) => ({
	snapToInterval:
		// TODO The interval is not correct,
		// the further we scroll the more the snap position is shifted to the left
		theme.gap(0.5) +
		// @ts-expect-error
		rt.screen.width / theme.layout.grid.columnCount[rt.breakpoint!],
}));

// export const InfiniteRow = <T0 extends Resource, T extends Resource>({
// 	query,
// 	...props
// }: Props<T0, T>) => {
// 	const { items, isFetching, isFetchingNextPage, fetchNextPage } =
// 		useInfiniteQuery(() => query);
//
// 	const itemList = useMemo(() => {
// 		const itemCount = items?.length ?? 0;
// 		if ((isFetching && !itemCount) || isFetchingNextPage) {
// 			return [...(items ?? []), undefined];
// 		}
// 		return items ?? [undefined];
// 	}, [items, isFetching, isFetchingNextPage]);
// 	return (
// 		<RowBase
// 			{...props}
// 			items={itemList}
// 			onEndReached={() => fetchNextPage()}
// 		/>
// 	);
// };
//
