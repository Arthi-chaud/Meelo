import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Pressable as Touchable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useInfiniteQuery } from "~/api";
import {
	BackgroundGradient,
	useSetKeyIllustration,
} from "~/components/background-gradient";
import { Illustration } from "~/components/illustration";
import { coverflowQueryAtom } from "~/state/coverflow";
import { Coverflow as CoverflowComponent } from "./component";
import { FlipCard } from "./flipcard";
import { FlippedCard } from "./flipped";
import { Footer } from "./footer";
import type { AlbumT } from "./utils";

const LOADNEXT_THRESHOLD = 10;

const Coverflow = withUnistyles(CoverflowComponent, (_, rt) => ({
	config: rt.isPortrait ? { spacing: 100 } : { spacing: 175, rotation: 70 },
}));
export default function CoverflowView() {
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

	const [isScrolling, setIsScrolling] = useState(false);
	const [flippedItemIdx, setFlippedItemIdx] = useState<number | null>(null);
	useSetKeyIllustration(selectedItem);
	return (
		<View style={styles.root}>
			<BackgroundGradient />
			{flippedItemIdx !== null && (
				<Touchable
					onPress={(e) => {
						e.stopPropagation();
						setFlippedItemIdx(null);
					}}
					style={styles.flippedCardBackgroud}
				/>
			)}
			<Coverflow
				style={styles.coverflow}
				data={items ?? []}
				itemKey={(album) => (album as AlbumT).slug}
				onPress={(idx) => {
					setFlippedItemIdx((oldIdx) => {
						if (oldIdx === idx) {
							return null;
						}
						return idx;
					});
					setIsScrolling(false);
				}}
				onScroll={(pos) => {
					setFlippedItemIdx(null);
					setIsScrolling(true);
					if (
						!isFetchingNextPage &&
						hasNextPage &&
						pos >= (items?.length ?? 0) - LOADNEXT_THRESHOLD
					) {
						fetchNextPage();
					}
				}}
				onChange={(idx) => {
					setSelectedItem(items?.at(idx));
					setIsScrolling(false);
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
			<Footer
				isScrolling={isScrolling}
				selectedItem={selectedItem}
				style={styles.footer}
			/>
		</View>
	);
}
const styles = StyleSheet.create((theme, rt) => ({
	root: {
		flex: 1,
		gap: theme.gap(3),
		paddingVertical: theme.gap(3),
		justifyContent: "center",
		alignItems: "center",
	},
	coverflow: {
		zIndex: 2, // We want flipcard to be above the text
		height: rt.isPortrait ? "20%" : "70%",
		width: "100%",
		maxHeight: rt.isPortrait ? 500 : 3000,
	},
	footer: { width: "90%" },
	card: {
		width: "100%",
		height: "100%",
		backfaceVisibility: "hidden",
	},
	flippedCardBackgroud: {
		// backgroundColor: "black",
		// opacity: 0.5,
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		flex: 1,
		height: rt.screen.height,
		width: rt.screen.width,
		zIndex: 1,
	},
}));
