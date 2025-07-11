import type { InfiniteQuery } from "@/api/query";
import type Resource from "@/models/resource";
import type React from "react";
import { createRef, useMemo } from "react";
import { FlatList, TouchableOpacity, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import { LoadableText } from "~/components/loadable_text";
import { EmptyState } from "../empty-state";

type Props<T0, T> = {
	query: InfiniteQuery<T0, T>;
	header: string;
	style?: ViewStyle;
	render: (item: T | undefined) => React.ReactElement;
	hideIfEmpty?: true;
};

//TODO Add 'see all' button

export const InfiniteRow = <T0 extends Resource, T extends Resource>({
	query,
	...props
}: Props<T0, T>) => {
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
		<RowBase
			{...props}
			items={itemList}
			onEndReached={() => fetchNextPage()}
		/>
	);
};

export const Row = <T extends Resource>({
	items,
	...props
}: { items: T[] | undefined } & Pick<
	Props<T, T>,
	"header" | "render" | "style" | "hideIfEmpty"
>) => {
	const itemList = useMemo(() => {
		return items ?? [undefined];
	}, [items]);

	return <RowBase {...props} items={itemList} />;
};

type BaseProps<T> = {
	items?: (T | undefined)[];
	header: string;
	style?: ViewStyle;
	render: (item: T | undefined) => React.ReactElement;
	onEndReached?: () => void;
	hideIfEmpty?: true;
};

const RowBase = <T,>({
	items,
	header,
	hideIfEmpty,
	style,
	render,
	onEndReached,
}: BaseProps<T>) => {
	const flatListRef = createRef<FlatList<unknown>>();
	return (
		(!hideIfEmpty || (items && items.length > 0)) && (
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
						content={
							items === undefined || items[0] === undefined
								? undefined
								: header
						}
					/>
				</TouchableOpacity>
				{items?.length !== 0 ? (
					<ResponsiveFlatList
						horizontal
						snapToAlignment="start"
						decelerationRate={"fast"}
						ref={flatListRef}
						data={items}
						onEndReached={onEndReached}
						contentContainerStyle={styles.row}
						renderItem={({ item, index }) => {
							return (
								<View style={[styles.item(index)]}>
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
	root: { display: "flex", alignItems: "flex-start" },
	emptyState: {
		aspectRatio: 2.5, // TODO this an approximate, would be nice to compute this correctly
		width: "100%",
	},
	header: {
		marginLeft: theme.gap(1),
		paddingHorizontal: theme.gap(1),
		marginBottom: theme.gap(1),
		borderRadius: theme.borderRadius,
		overflow: "hidden",
	},
	row: { gap: theme.gap(0.5), paddingRight: theme.gap(1) },
	item: (itemIndex: number) => ({
		marginLeft: itemIndex === 0 ? theme.gap(1) : 0,
		// @ts-expect-error
		width: rt.screen.width / theme.layout.grid.columnCount[rt.breakpoint!],
	}),
}));

const ResponsiveFlatList = withUnistyles(FlatList, (theme, rt) => ({
	// @ts-expect-error
	initialNumToRender: theme.layout.grid.columnCount[rt.breakpoint!],
	snapToInterval:
		// TODO The interval is not correct,
		// the further we scroll the more the snap position is shifted to the left
		theme.gap(0.5) +
		// @ts-expect-error
		rt.screen.width / theme.layout.grid.columnCount[rt.breakpoint!],
}));
