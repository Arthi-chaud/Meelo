import { type ContentStyle, FlashList } from "@shopify/flash-list";
import type React from "react";
import { type ComponentProps, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { InfiniteQuery } from "@/api/query";
import type { IllustratedResource } from "@/models/illustration";
import type { LayoutOption } from "@/models/layout";
import type Resource from "@/models/resource";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery } from "~/api";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Divider } from "~/primitives/divider";
import { breakpoints } from "~/theme";
import { useSetKeyIllustrationFromInfiniteQuery } from "../background-gradient";
import { EmptyState } from "../empty-state";
import { Controls } from "./controls/component";

//TODO Grid: The breakpoint's type from rt does not seem to use the type defined in the theme
//It should be typesafe

//TODO Button to scroll back up

//TODO Avoid refresh component to be displayed when we tap an item in search page

// Notes:
// the navigation header being positioned using 'absolute'
// We need to rely on the root view style hook to get its height
//
// The controls (libraries, types, etc.) are positioned absolutely, with padding to avoid overlap with header
//
// The scroll view itself has a top padding where the controls should end up being layed out in

type Props<T, T1, Sort extends string> = {
	query: InfiniteQuery<T, T1>;
	layout: LayoutOption;
	header?: React.ReactElement;
	controls: Omit<ComponentProps<typeof Controls<Sort>>, "style">;
	render: (
		item: T1 | undefined,
		index: number,
		items: T1[] | undefined,
	) => React.ReactElement;
	ignoreTabBar?: true;
};

export const InfiniteView = <
	T extends Resource,
	T1 extends IllustratedResource,
	Sort extends string,
>(
	props: Props<T, T1, Sort>,
) => {
	styles.useVariants({ layout: props.layout });
	const { paddingBottom, paddingTop } = useRootViewStyle();
	const queryRes = useInfiniteQuery(() => props.query);
	const [controlsHeight, setControlsHeight] = useState(null as number | null);
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
	const ScrollView = props.layout === "list" ? List : Grid;
	useSetKeyIllustrationFromInfiniteQuery(props.query);
	return (
		<View style={[styles.rootStyle]}>
			{props.header && (
				<View style={[{ paddingTop }, styles.optionalHeader]}>
					{props.header}
					<Divider h />
				</View>
			)}
			<View style={styles.body}>
				<View
					style={styles.controls(props.header ? 0 : paddingTop)}
					onLayout={(e) =>
						setControlsHeight(e.nativeEvent.layout.height)
					}
				>
					<Controls {...props.controls} />
				</View>

				{firstPage?.length === 0 ? (
					<View style={styles.emptyState}>
						<EmptyState />
					</View>
				) : (
					<ScrollView
						data={itemList}
						refreshing={queryRes.isRefetching}
						contentContainerStyle={
							[
								styles.scrollView,
								{ paddingBottom },
							] as ContentStyle
						}
						onRefresh={() => queryRes.refetch()}
						onEndReachedThreshold={0.5}
						onEndReached={() => queryRes.fetchNextPage()}
						ListHeaderComponent={
							<View
								style={styles.scrollViewTopPadding(
									controlsHeight,
								)}
							/>
						}
						renderItem={({ item, index }) => {
							return (
								<View style={styles.itemContainer}>
									{props.render(
										item as T1 | undefined,
										index,
										itemList as T1[] | undefined,
									)}
								</View>
							);
						}}
						{...(props.layout === "grid"
							? {
									uniProps: (theme, rt) => ({
										keyExtractor: (_, idx) => {
											const item =
												queryRes.items?.at(idx);
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
		</View>
	);
};

const Grid = withUnistyles(FlashList, (theme, rt) => {
	// @ts-expect-error
	const colCount = theme.layout.grid.columnCount[rt.breakpoint!];
	return {
		onEndReachedThreshold: rt.screen.height,
		estimatedItemSize: rt.screen.width / colCount,
		numColumns: colCount,
	};
});

const List = withUnistyles(FlashList, (_, rt) => ({
	numColumns: 1,
	onEndReachedThreshold: rt.screen.height,
	estimatedItemSize: 70, // TODO
	ItemSeparatorComponent: () => <Divider h withInsets />,
}));

const styles = StyleSheet.create((theme) => ({
	rootStyle: {
		flex: 1,
		position: "relative",
		alignItems: "center",
		height: "100%",
		width: "100%",
	},
	// TODO it would be nice to be able to scroll using the gutters when device is larger than xl
	body: { flex: 1, width: "100%", maxWidth: breakpoints.xl },
	optionalHeader: {},
	emptyState: { height: "100%", justifyContent: "center" },
	controls: (paddingTop: number) => ({
		paddingBottom: theme.gap(1.5),
		paddingTop: theme.gap(1.5) + paddingTop,
		paddingHorizontal: theme.gap(1),
		position: "absolute",
		zIndex: 1,
		width: "100%",
	}),
	scrollView: {
		paddingHorizontal: theme.gap(1),
	},
	//approximate so that the list start below controls
	//putting the actual controls in the ListHeaderComponent causes the dropdown to be misplaced
	scrollViewTopPadding: (controlsHeight: number | null) => ({
		paddingTop: controlsHeight == null ? theme.gap(8.25) : controlsHeight,
	}),
	itemContainer: {
		variants: {
			layout: {
				// TODO Gap between columns?
				grid: { width: "100%" },
				list: {},
			},
		},
	},
}));
