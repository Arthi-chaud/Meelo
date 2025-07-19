import type { SongWithRelations } from "@/models/song";
import { generateArray } from "@/utils/gen-list";
import { type ComponentProps, Fragment, createRef, useMemo } from "react";
import { ScrollView, View, type ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Divider } from "~/primitives/divider";
import { breakpoints } from "~/theme";
import type { ListItem } from "./list-item";
import { SongItem } from "./list-item/resource/song";
import { SectionHeader } from "./section-header";

type Song = SongWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

//TODO Add 'see all' button

type Props = {
	songs: Song[] | undefined;
	style?: ViewStyle;
	header?: string;
	hideIfEmpty?: true;
	illustrationProps?: ComponentProps<typeof ListItem>["illustrationProps"];
	subtitle: null | ((song: Song) => "artists" | null);
};

const ItemsPerColumn = 4;

export const SongGrid = ({
	songs,
	subtitle,
	header,
	illustrationProps,
	hideIfEmpty,
	...props
}: Props) => {
	const scrollViewRef = createRef<ScrollView>();
	const chunks = useMemo(() => {
		if (songs === undefined) {
			return [generateArray(ItemsPerColumn, undefined)];
		}
		const res: Song[][] = [];
		for (let i = 0; i < songs.length; i += ItemsPerColumn) {
			res.push(songs.slice(i, i + ItemsPerColumn));
		}
		return res;
	}, [songs]);
	return (
		(songs === undefined ||
			(!hideIfEmpty && songs.length === 0) ||
			songs.length > 0) && (
			<View style={[styles.root, props.style]}>
				{header && (
					<SectionHeader
						onPress={() =>
							scrollViewRef.current?.scrollTo({
								x: 0,
								animated: true,
							})
						}
						skeletonWidth={header.length}
						content={songs === undefined ? undefined : header}
					/>
				)}
				<SnappyScrollView
					horizontal
					snapToAlignment="start"
					decelerationRate={"normal"}
					ref={scrollViewRef}
					style={styles.scrollView}
				>
					{chunks.map((chunk, chunkIdx) => (
						<View
							key={chunkIdx}
							style={styles.column(
								chunkIdx,
								chunkIdx === chunks.length - 1,
							)}
						>
							{chunk.map((item, idx) => (
								<Fragment
									key={
										item?.id.toString() ?? `skeleton-${idx}`
									}
								>
									<SongItem
										song={item}
										subtitle={
											subtitle === null
												? null
												: item
													? subtitle(item)
													: undefined
										}
										illustrationProps={illustrationProps}
									/>

									{idx !== chunk.length - 1 && (
										<Divider h withInsets />
									)}
								</Fragment>
							))}
						</View>
					))}
				</SnappyScrollView>
			</View>
		)
	);
};

const ColumnWidthRatio = 0.9;

const styles = StyleSheet.create((theme, rt) => ({
	root: { display: "flex", alignItems: "flex-start" },
	scrollView: {},
	column: (idx: number, isLast: boolean) => ({
		paddingRight: isLast ? theme.gap(4) : theme.gap(1),
		width: rt.screen.width * (!isLast ? ColumnWidthRatio : 1),
		maxWidth: breakpoints.sm * ColumnWidthRatio,
		marginLeft: idx === 0 && !isLast ? theme.gap(1) : 0,
		// Preventing single-col grids to be scrollable
		paddingLeft: idx === 0 && isLast ? theme.gap(1) : 0,
	}),
}));

const SnappyScrollView = withUnistyles(ScrollView, (_, rt) => ({
	//TODO Check
	snapToInterval:
		(rt.screen.width >= breakpoints.sm ? breakpoints.sm : rt.screen.width) *
		ColumnWidthRatio,
}));
