import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import { generateArray } from "@/utils/gen-list";
import { type ComponentProps, Fragment, createRef, useMemo } from "react";
import {
	ScrollView,
	TouchableOpacity,
	View,
	type ViewStyle,
} from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Divider } from "~/primitives/divider";
import { breakpoints } from "~/theme";
import { ListItem } from "./list-item";
import { LoadableText } from "./loadable_text";

type Song = SongWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

//TODO Add 'see all' button

type Props = {
	songs: Song[] | undefined;
	style?: ViewStyle;
	header: string;
	hideIfEmpty?: true;
	illustrationProps?: ComponentProps<typeof ListItem>["illustrationProps"];
	subtitle?: (song: Song) => "artists" | null;
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
			<View style={props.style}>
				<TouchableOpacity
					touchSoundDisabled
					style={styles.header}
					onPress={() =>
						scrollViewRef.current?.scrollTo({
							x: 0,
							animated: true,
						})
					}
				>
					<LoadableText
						variant="h4"
						skeletonWidth={header.length}
						content={songs === undefined ? undefined : header}
					/>
				</TouchableOpacity>
				<SnappyScrollView
					horizontal
					ref={scrollViewRef}
					style={styles.scrollView}
				>
					{chunks.map((chunk, idx) => (
						<View
							key={idx}
							style={styles.column(
								idx,
								idx === chunks.length - 1,
							)}
						>
							{chunk.map((item, idx) => (
								<Fragment
									key={
										item?.id.toString() ?? `skeleton-${idx}`
									}
								>
									<ListItem
										title={item?.name}
										onPress={() => {}} // TODO
										illustration={item?.illustration}
										illustrationProps={illustrationProps}
										subtitle={
											item === undefined
												? undefined
												: subtitle?.(item) === "artists"
													? formatArtists(
															item.artist,
															item.featuring,
														)
													: null
										}
									/>

									{idx !== ItemsPerColumn - 1 && (
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
	header: {
		marginLeft: theme.gap(1),
		paddingHorizontal: theme.gap(1),
		marginBottom: theme.gap(1),
		borderRadius: theme.borderRadius,
		overflow: "hidden",
	},
	scrollView: {},
	column: (idx: number, isLast: boolean) => ({
		paddingRight: isLast ? theme.gap(4) : theme.gap(1),
		width: rt.screen.width * (!isLast ? ColumnWidthRatio : 1),
		maxWidth: breakpoints.sm * ColumnWidthRatio,
		marginLeft: idx === 0 ? theme.gap(1) : 0,
	}),
}));

const SnappyScrollView = withUnistyles(ScrollView, (_, rt) => ({
	//TODO Check
	snapToInterval:
		(rt.screen.width >= breakpoints.sm ? breakpoints.sm : rt.screen.width) *
		ColumnWidthRatio,
}));
