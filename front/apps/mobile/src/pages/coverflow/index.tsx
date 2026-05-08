import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { AlbumWithRelations } from "@/models/album";
import { formatArtists_ } from "@/utils/format-artists";
import { useInfiniteQuery } from "~/api";
import {
	BackgroundGradient,
	useSetKeyIllustration,
} from "~/components/background-gradient";
import { Illustration } from "~/components/illustration";
import { usePickArtistModal } from "~/components/pick-artist";
import { releaseTracklistQuery } from "~/pages/release/queries";
import { TrackItem } from "~/pages/release/tracklist";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { coverflowQueryAtom } from "~/state/coverflow";
import { animations } from "~/theme";
import { Coverflow as CoverflowComponent } from "./component";
import { FlipCard } from "./flipcard";

const LOADNEXT_THRESHOLD = 10;

type AlbumT = AlbumWithRelations<"artists" | "illustration">;

const Coverflow = withUnistyles(CoverflowComponent, (_, rt) => ({
	config: rt.isPortrait ? { spacing: 100 } : { spacing: 175, rotation: 70 },
}));
export default function CoverflowView() {
	const { t } = useTranslation();
	const router = useRouter();
	const query = useAtomValue(coverflowQueryAtom);
	const { items, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(() => query!); // TODO:
	useEffect(() => {
		if (items?.length === 0) {
			router.back();
		}
	}, [query, items]);

	const [selectedItem, setSelectedItem] = useState<AlbumT | undefined>(
		items?.at(0),
	);

	const { openModal: openPickArtistModal } = usePickArtistModal(
		selectedItem?.artists,
	);
	const textOpacity = useSharedValue(1);
	const [flippedItemIdx, setFlippedItemIdx] = useState<number | null>(null);
	useSetKeyIllustration(selectedItem);
	return (
		<View style={styles.root}>
			<BackgroundGradient />
			<Coverflow
				style={styles.coverflow}
				data={items ?? []}
				itemKey={(album) => (album as AlbumT).slug}
				onPress={(idx) =>
					setFlippedItemIdx((oldIdx) => {
						if (oldIdx === idx) {
							return null;
						}
						return idx;
					})
				}
				onScroll={(pos) => {
					setFlippedItemIdx(null);
					if (
						!isFetchingNextPage &&
						hasNextPage &&
						pos >= (items?.length ?? 0) - LOADNEXT_THRESHOLD
					) {
						fetchNextPage();
					}
					if (textOpacity.value) {
						textOpacity.value = withTiming(0, animations.fades);
					}
				}}
				onChange={(idx) => {
					setSelectedItem(items?.at(idx));
					textOpacity.value = withTiming(1, animations.fades);
				}}
				renderItem={(item) => {
					const [idx, album] = item as [number, AlbumT];
					return (
						<FlipCard
							isFlipped={flippedItemIdx === idx}
							cardStyle={styles.card}
							head={
								<Illustration
									illustration={album.illustration}
									quality="high"
								/>
							}
							tail={
								<FlippedCard
									album={album}
									flipped={flippedItemIdx === idx}
								/>
							}
						/>
					);
				}}
			/>
			<Animated.View style={[styles.text, { opacity: textOpacity }]}>
				{selectedItem && (
					<>
						<Pressable
							onPress={() => {
								router.replace(
									`/releases/${selectedItem.masterId}`,
								);
							}}
						>
							<Text
								content={selectedItem.name ?? ""}
								variant="resourceTitle"
								numberOfLines={1}
							/>
						</Pressable>
						<Pressable
							disabled={selectedItem.artists.length === 0}
							onPress={() => {
								if (selectedItem.artists.length > 1) {
									openPickArtistModal();
								} else {
									router.replace(
										`/artists/${selectedItem.artists[0].id}`,
									);
								}
							}}
						>
							<Text
								content={
									selectedItem.artists.length !== 0
										? formatArtists_(selectedItem.artists)
										: t("compilationArtistLabel")
								}
								variant="secondaryTitle"
								numberOfLines={1}
							/>
						</Pressable>
					</>
				)}
			</Animated.View>
		</View>
	);
}
const FlippedCard = ({
	album,
	flipped,
}: {
	album: AlbumWithRelations<"artists" | "illustration">;
	flipped: boolean;
}) => {
	const tracks = useInfiniteQuery(
		(id) => releaseTracklistQuery(id),
		!flipped ? undefined : (album.masterId ?? undefined),
	);
	if (!flipped) {
		return <View style={styles.flippedCard} />;
	}
	return (
		<FlashList
			style={styles.flippedCard}
			data={tracks.items}
			renderItem={({ item: track }) => (
				<TrackItem
					track={track}
					onPress={() => {}}
					albumArtists={album.artists}
					maxTrackIndex={10}
				/>
			)}
		/>
	);
};

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		flex: 1,
		gap: theme.gap(3),
		paddingVertical: theme.gap(3),
		justifyContent: "center",
		alignItems: "center",
	},
	coverflow: {
		height: rt.isPortrait ? "20%" : "70%",
		width: "100%",
		maxHeight: rt.isPortrait ? 500 : 3000,
	},
	text: {
		width: "80%",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	card: {
		width: "100%",
		height: "100%",
		backfaceVisibility: "hidden",
	},
	flippedCard: {
		aspectRatio: 1,
		height: "100%",
		width: "100%",
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius,
	},
}));
