import {
	type BottomSheetFlatListMethods,
	BottomSheetScrollView,
	type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { SyncedLyric } from "@/models/lyrics";
import { store } from "@/state/store";
import { LyricsIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useQuery } from "~/api";
import { EmptyState } from "~/components/empty-state";
import { LoadableText } from "~/components/loadable_text";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import { getSongWithLyrics } from "../queries";
import { currentTrackAtom, progressAtom } from "../state";

export const Lyrics = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const trackIsVideoOnly = currentTrack?.track.songId === null;
	const { data: song } = useQuery(
		getSongWithLyrics,
		currentTrack?.track.songId ?? undefined,
	);
	return (
		<View style={styles.root}>
			<Divider h />
			{song?.lyrics === null || trackIsVideoOnly ? (
				<View style={styles.emptyStateContainer}>
					<EmptyState icon={LyricsIcon} text="emptyState.lyrics" />
				</View>
			) : song?.lyrics.synced && currentTrack?.track.type === "Audio" ? (
				<SyncedLyrics syncedLyrics={song.lyrics.synced} />
			) : (
				<PlainLyrics plainLyrics={song?.lyrics.plain} />
			)}
		</View>
	);
};

const PlainLyrics = ({ plainLyrics }: { plainLyrics: string | undefined }) => {
	const lines: (string | undefined)[] = useMemo(
		() => plainLyrics?.split("\n") ?? generateArray(20),
		[plainLyrics],
	);
	return (
		<BottomSheetScrollView contentContainerStyle={styles.plainLyrics}>
			{lines.map((line, idx) => (
				<LoadableText
					key={idx}
					content={line}
					variant="body"
					skeletonWidth={20 + (idx % 5)}
				/>
			))}
		</BottomSheetScrollView>
	);
};

type SyncedLyricWithEnd = SyncedLyric & {
	end: number | null;
	position?: number;
	height?: number;
};

const SyncedLyrics = ({ syncedLyrics }: { syncedLyrics: SyncedLyric[] }) => {
	const scrollViewRef = useRef<BottomSheetScrollViewMethods>(null);
	const [scrollViewHeight, setScrollViewHeight] = useState<number | null>(
		null,
	);
	const [syncedLyricsWithEnd, setSyncedLyricsWithEnd] = useState<
		SyncedLyricWithEnd[]
	>([]);
	const [currentLyric, setCurrentLyric] = useState<SyncedLyricWithEnd | null>(
		null,
	);
	useEffect(() => {
		setSyncedLyricsWithEnd(
			syncedLyrics.map((l, index) => ({
				...l,
				end: syncedLyrics.at(index + 1)?.timestamp ?? null,
			})),
		);
	}, [syncedLyrics]);
	const onInterval = useCallback(() => {
		const progress = store.get(progressAtom);
		if (
			currentLyric &&
			currentLyric.timestamp <= progress &&
			(currentLyric.end ? progress < currentLyric.end : true)
		) {
			return;
		}
		const nextLyricIndex = syncedLyricsWithEnd?.findIndex(
			(entry) =>
				entry.timestamp <= progress &&
				(entry.end ? progress < entry.end : true),
		);
		if (nextLyricIndex === -1 || nextLyricIndex === undefined) {
			setCurrentLyric(null);
			return;
		}
		const nextLyric = syncedLyricsWithEnd[nextLyricIndex];
		if (nextLyric.position && scrollViewHeight && nextLyric.height) {
			const centerOffset =
				nextLyric.position +
				nextLyric.height / 2 -
				scrollViewHeight / 2;
			scrollViewRef.current?.scrollTo({
				// If the lyrics is above the half point of the screen, don't scroll
				// Otherwise, scroll so that the lyric is in the center
				y: Math.min(Math.max(centerOffset, 0), centerOffset),
				animated: true,
			});
		}
		setCurrentLyric(nextLyric);
	}, [syncedLyricsWithEnd, currentLyric, scrollViewHeight]);
	useEffect(() => {
		const interval = setInterval(() => onInterval(), 100);

		return () => clearInterval(interval);
	}, [onInterval]);
	return (
		<BottomSheetScrollView
			ref={scrollViewRef}
			scrollEnabled={false}
			showsVerticalScrollIndicator={false}
			onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
		>
			<View style={[styles.syncedLyrics]}>
				{syncedLyricsWithEnd.map(({ timestamp, content }) => (
					<Text
						key={timestamp}
						variant="h2"
						color={
							currentLyric?.timestamp === timestamp
								? "primary"
								: "secondary"
						}
						content={content ?? " "}
						onLayout={(e) => {
							// Need to store it in a variable
							// to avoid access after free of e
							const y = e.nativeEvent.layout.y;

							const height = e.nativeEvent.layout.height;
							setSyncedLyricsWithEnd((lyrics) => {
								return lyrics.map((l) => {
									if (l.timestamp === timestamp) {
										l.position = y;
										l.height = height;
									}
									return l;
								});
							});
						}}
					/>
				))}
			</View>
		</BottomSheetScrollView>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%", flex: 1 },
	plainLyrics: { paddingVertical: theme.gap(2), gap: theme.gap(0.5) },
	syncedLyrics: {
		height: "100%",
		gap: theme.gap(2),
		paddingVertical: theme.gap(2),
	},
	emptyStateContainer: { flex: 1, justifyContent: "center" },
}));
