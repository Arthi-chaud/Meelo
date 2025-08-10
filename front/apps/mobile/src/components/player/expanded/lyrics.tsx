import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAtomValue } from "jotai";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { LyricsIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useQuery } from "~/api";
import { EmptyState } from "~/components/empty-state";
import { LoadableText } from "~/components/loadable_text";
import { Divider } from "~/primitives/divider";
import { getSongWithLyrics } from "../queries";
import { currentTrackAtom } from "../state";

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
					<View style={styles.emptyState}>
						<EmptyState
							icon={LyricsIcon}
							text="emptyState.lyrics"
						/>
					</View>
				</View>
			) : (
				<BottomSheetScrollView contentContainerStyle={styles.content}>
					{(song?.lyrics.plain.split("\n") ?? generateArray(20)).map(
						(line: string | undefined, idx) => (
							<LoadableText
								key={idx}
								content={line}
								variant="body"
								skeletonWidth={20 + (idx % 5)}
							/>
						),
					)}
				</BottomSheetScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%", flex: 1 },
	content: { paddingVertical: theme.gap(2), gap: theme.gap(0.5) },
	emptyStateContainer: { flex: 1, justifyContent: "center" },
	emptyState: { aspectRatio: 2.5 }, //TODO
}));
