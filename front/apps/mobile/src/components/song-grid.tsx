import type { Href } from "expo-router";
import { useSetAtom } from "jotai";
import {
	type ComponentProps,
	createRef,
	Fragment,
	useCallback,
	useMemo,
	useState,
} from "react";
import { ScrollView, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { SongWithRelations } from "@/models/song";
import { playTracksAtom, type TrackState } from "@/state/player";
import { generateArray } from "@/utils/gen-list";
import type { ListItem } from "~/components/item/list-item";
import { SongItem } from "~/components/item/resource/song";
import { SectionHeader } from "~/components/section-header";
import { Divider } from "~/primitives/divider";

type Song = SongWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

type Props = {
	songs: Song[] | undefined;
	style?: ViewStyle;
	seeMore?: Href;
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
	seeMore,
	...props
}: Props) => {
	const playTracks = useSetAtom(playTracksAtom);
	const scrollViewRef = createRef<ScrollView>();
	const [columnWidth, setColumnWidth] = useState<number>();
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
	const onItemPress = useCallback(
		(index: number) => {
			if (songs === undefined) {
				return;
			}
			const tracks = songs.map(
				(s): TrackState => ({
					track: { ...s.master, illustration: s.illustration },
					artist: s.artist,
				}),
			);
			playTracks({ tracks, cursor: index });
		},
		[songs],
	);
	return (
		(songs === undefined ||
			(!hideIfEmpty && songs.length === 0) ||
			songs.length > 0) && (
			<View style={[styles.root, props.style]}>
				{header && (
					<SectionHeader
						seeMore={seeMore}
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
				<ScrollView
					horizontal
					snapToAlignment="start"
					decelerationRate={"normal"}
					snapToInterval={columnWidth}
					ref={scrollViewRef}
				>
					{chunks.map((chunk, chunkIdx) => (
						<View
							key={chunkIdx}
							style={styles.column(
								chunkIdx,
								chunkIdx === chunks.length - 1,
							)}
							onLayout={(e) =>
								chunkIdx === 1 &&
								setColumnWidth(e.nativeEvent.layout.width)
							}
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
										onPress={() =>
											onItemPress(
												idx + chunkIdx * ItemsPerColumn,
											)
										}
									/>

									{idx !== chunk.length - 1 && (
										<Divider h withInsets />
									)}
								</Fragment>
							))}
						</View>
					))}
				</ScrollView>
			</View>
		)
	);
};

const ColumnWidthRatio = 0.9;

const styles = StyleSheet.create((theme, rt) => {
	const width = (columnCount: number) => {
		return rt.screen.width * (ColumnWidthRatio / columnCount);
	};
	return {
		root: { display: "flex", alignItems: "flex-start" },
		column: (idx: number, isLast: boolean) => ({
			paddingRight: theme.gap(1),

			marginRight: isLast ? rt.screen.width * (1 - ColumnWidthRatio) : 0,
			width: {
				xs: width(1),
				sm: width(2),
				xl: width(3),
			},
			marginLeft: idx === 0 && !isLast ? theme.gap(1) : 0,
			// Preventing single-col grids to be scrollable
			paddingLeft: idx === 0 && isLast ? theme.gap(1) : 0,
		}),
	};
});
