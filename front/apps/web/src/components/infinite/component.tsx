import { LegendList } from "@legendapp/list/react";
import { Box, type Breakpoint, Divider, Grid, useTheme } from "@mui/material";
import { Fragment, type ReactNode, useMemo, useRef } from "react";
import { useWindowSize } from "react-use";
import type { InfiniteQueryFn } from "@/api/query";
import type { IllustratedResource } from "@/models/illustration";
import type { ItemSize } from "@/models/layout";
import type Resource from "@/models/resource";
import { EmptyStateIcon } from "@/ui/icons";
import { ParentScrollableDivId } from "@/utils/constants";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery } from "~/api";
import { useGradientBackground } from "~/components/gradient-background";
import { EmptyState, type EmptyStateProps } from "../empty-state";

type InfiniteProps<T extends Resource, F extends Resource = T> = {
	query: InfiniteQueryFn<T, F>;
	nested?: true;
	emptyState?: EmptyStateProps;
	render: (
		item: F | undefined,
		items: (F | undefined)[],
		index: number,
	) => ReactNode;
};

const positions = new Map<string, { index: number }>();

const GridPresets: Record<ItemSize, Partial<Record<Breakpoint, number>>> = {
	// Note: values of sm == values of md,
	// because of navbar reducing the actual sufrace of md
	xs: { xs: 12 / 5, sm: 2, md: 12 / 8, lg: 12 / 10, xl: 1 },
	s: { xs: 3, sm: 12 / 5, md: 12 / 5, lg: 12 / 8, xl: 12 / 10 },
	m: { xs: 4, sm: 3, md: 3, lg: 2, xl: 12 / 8 },
	l: { xs: 6, sm: 4, md: 4, lg: 12 / 5, xl: 12 / 6 },
	xl: { xs: 12, sm: 6, md: 6, lg: 12 / 4, xl: 12 / 5 },
};

const InfiniteGrid = <T extends Resource, F extends IllustratedResource>(
	props: InfiniteProps<T, F> & {
		itemSize: ItemSize;
	},
) => {
	return <Infinite layout="grid" {...props} />;
};

const InfiniteList = <T extends Resource, F extends IllustratedResource>(
	props: InfiniteProps<T, F>,
) => {
	return <Infinite layout="list" {...props} />;
};

const useBreakpoint = () => {
	const { width } = useWindowSize();
	const theme = useTheme();
	const breakpoints = useMemo(
		() =>
			Object.entries(theme.breakpoints.values).sort(
				([_k, val], [_k2, val2]) => val - val2,
			) as [Breakpoint, number][],
		[theme.breakpoints],
	);
	const breakpoint = useMemo(() => {
		const bp = breakpoints.findLast(([_, x]) => x <= width);
		if (!bp) return "xs";
		return bp[0];
	}, [breakpoints, width]);
	return breakpoint;
};

const Infinite = <T extends Resource, F extends IllustratedResource>(
	props: InfiniteProps<T, F> &
		(
			| {
					layout: "grid";
					itemSize: ItemSize;
			  }
			| { layout: "list"; itemSize?: any }
		),
) => {
	const { items, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(props.query);
	//NOTE: Use of AI for the logic to restore the scroll position
	const entryKey = useRef<string | undefined>(
		typeof window !== "undefined" ? window.history.state?.key : undefined,
	).current;
	const saved = useRef(
		entryKey ? positions.get(entryKey) : undefined,
	).current;

	const { GradientBackground } = useGradientBackground(
		items?.find((item) => item?.illustration !== undefined)?.illustration
			?.colors,
		-1,
	);
	const data: (F | undefined)[] = useMemo(() => {
		if (items === undefined) {
			return generateArray(3);
		}
		if (isFetchingNextPage) {
			return [...items, ...generateArray(3)];
		}
		return items;
	}, [items, isFetchingNextPage]);
	const breakpoint = useBreakpoint();
	const colGap = ["xs", "s"].includes(props.itemSize) ? 1.5 : 2;
	const colCount =
		props.layout === "grid"
			? 12 / GridPresets[props.itemSize][breakpoint]!
			: 1;

	return (
		<>
			<GradientBackground />
			{items?.length === 0 && (
				<EmptyState
					icon={props.emptyState?.icon ?? <EmptyStateIcon />}
					text={props.emptyState?.text ?? "emptyState.default"}
					actions={props.emptyState?.actions ?? []}
				/>
			)}
			{typeof window === "undefined" ? (
				props.layout === "list" ? (
					<>
						{generateArray(3).map((_, i) => (
							<Fragment key={i}>
								{props.render(undefined, [], i)}
								<Divider variant="middle" />
							</Fragment>
						))}
					</>
				) : (
					<Grid container columnSpacing={colGap}>
						{generateArray(3).map((_, i) => (
							<Grid key={i} size={GridPresets[props.itemSize]}>
								{props.render(undefined, [], i)}
							</Grid>
						))}
					</Grid>
				)
			) : (
				<LegendList
					style={{ flex: 1 }}
					data={data}
					initialScrollIndex={
						saved ? { index: saved.index } : undefined
					}
					scrollElement={
						props.nested
							? undefined
							: typeof document === "undefined"
								? undefined
								: document.getElementById(ParentScrollableDivId)
					}
					keyExtractor={(i, idx) =>
						i !== undefined ? i.id.toString() : `skeleton-${idx}`
					}
					onFirstVisibleItemChanged={({ index }) => {
						if (entryKey) positions.set(entryKey, { index });
					}}
					numColumns={colCount}
					maintainVisibleContentPosition
					recycleItems
					renderItem={({ item, index }) => (
						<Box
							sx={
								props.layout === "grid"
									? {
											margin: 0.75, //NOTE: Hack to allow focused tiles to overflow
											overflow: "visible",
										}
									: undefined
							}
						>
							{props.render(item, data, index)}
						</Box>
					)}
					onEndReached={hasNextPage ? () => fetchNextPage() : null}
					ItemSeparatorComponent={
						props.layout === "list"
							? () => <Divider variant="middle" />
							: undefined
					}
				/>
			)}
		</>
	);
};

export { InfiniteGrid, InfiniteList };
