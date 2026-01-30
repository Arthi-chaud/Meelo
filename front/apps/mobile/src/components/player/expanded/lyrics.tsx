import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type LayoutChangeEvent, ScrollView, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import type { SyncedLyric as SyncedLyricModel } from "@/models/lyrics";
import { store } from "@/state/store";
import { LyricsIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useQuery } from "~/api";
import { EmptyState } from "~/components/empty-state";
import { LoadableText } from "~/components/loadable_text";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { breakpoints } from "~/theme";
import { getSongWithLyrics } from "../queries";
import {
	currentTrackAtom,
	progressAtom,
	requestedProgressAtom,
} from "../state";

export const Lyrics = () => {
	const { t } = useTranslation();
	const currentTrack = useAtomValue(currentTrackAtom);
	const trackIsVideoOnly = currentTrack?.track.songId === null;
	const [shouldUseSyncedLyrics, preferSyncedLyrics] = useState(true);
	const { data: song } = useQuery(
		getSongWithLyrics,
		currentTrack?.track.songId ?? undefined,
	);
	const canUseSyncedLyrics = !!(
		song?.lyrics?.synced && currentTrack?.track.type === "Audio"
	);
	return (
		<View style={styles.root}>
			<Divider h />
			{canUseSyncedLyrics && (
				<View style={styles.toggleButton}>
					<Button
						size="small"
						title={
							shouldUseSyncedLyrics
								? t("player.plainLyrics")
								: t("player.syncedLyrics")
						}
						onPress={() => preferSyncedLyrics((p) => !p)}
					/>
				</View>
			)}
			{song?.lyrics === null || trackIsVideoOnly ? (
				<View style={styles.emptyStateContainer}>
					<EmptyState icon={LyricsIcon} text="emptyState.lyrics" />
				</View>
			) : canUseSyncedLyrics && shouldUseSyncedLyrics ? (
				<SyncedLyrics syncedLyrics={song.lyrics.synced!} />
			) : (
				<PlainLyrics
					plainLyrics={song?.lyrics.plain}
					hasToggle={canUseSyncedLyrics}
				/>
			)}
		</View>
	);
};

const PlainLyrics = ({
	plainLyrics,
	hasToggle,
}: {
	plainLyrics: string | undefined;
	hasToggle: boolean;
}) => {
	const lines: (string | undefined)[] = useMemo(
		() => plainLyrics?.split("\n") ?? generateArray(20),
		[plainLyrics],
	);
	styles.useVariants({ hasToggle });
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

type SyncedLyricWithEnd = SyncedLyricModel & {
	end: number | null;
	position?: number;
	height?: number;
};

const SyncedLyrics = ({
	syncedLyrics,
}: {
	syncedLyrics: SyncedLyricModel[];
}) => {
	const scrollViewRef = useRef<ScrollView>(null);
	const [scrollViewHeight, setScrollViewHeight] = useState<number | null>(
		null,
	);
	const [syncedLyricsWithEnd, setSyncedLyricsWithEnd] = useState<
		SyncedLyricWithEnd[]
	>([]);
	const [currentLyric, setCurrentLyric] = useState<SyncedLyricWithEnd | null>(
		null,
	);
	const requestProgress = useSetAtom(requestedProgressAtom);
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
		<ScrollView
			ref={scrollViewRef}
			scrollEnabled={false}
			showsVerticalScrollIndicator={false}
			onLayout={(e: any) =>
				setScrollViewHeight(e.nativeEvent.layout.height)
			}
		>
			<View style={[styles.syncedLyrics]}>
				{syncedLyricsWithEnd.map(({ timestamp, content }, idx) => (
					<SyncedLyric
						key={idx}
						content={content ?? " "}
						active={currentLyric?.timestamp === timestamp}
						onPress={() => requestProgress(timestamp)}
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
		</ScrollView>
	);
};

const SyncedLyric = ({
	content,
	active,
	onLayout,
	onPress,
}: {
	content: string;
	active: boolean;
	onLayout: (e: LayoutChangeEvent) => void;
	onPress: () => void;
}) => {
	const theme = useAnimatedTheme();
	const opacityOnActive = useAnimatedStyle(
		() => ({
			opacity: withSpring(active ? 1 : 0.4, theme.value.animations.fades),
		}),
		[active],
	);
	return (
		<Pressable onPress={onPress} onLayout={onLayout}>
			<Animated.View style={opacityOnActive}>
				<Text variant="h2" color="primary" content={content} />
			</Animated.View>
		</Pressable>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%", flex: 1, maxWidth: breakpoints.md },
	plainLyrics: {
		paddingVertical: theme.gap(2),
		gap: theme.gap(0.5),
		variants: {
			hasToggle: { true: { paddingBottom: theme.gap(6) }, false: {} },
		},
	},
	toggleButton: {
		position: "absolute",
		bottom: theme.gap(1.5),
		right: theme.gap(0.5),
		zIndex: 10,
	},
	syncedLyrics: {
		height: "100%",
		gap: theme.gap(2),
		paddingVertical: theme.gap(2),
	},
	emptyStateContainer: { flex: 1, justifyContent: "center" },
}));
