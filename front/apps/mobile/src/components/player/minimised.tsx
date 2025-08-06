import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { cursorAtom, playlistAtom, skipTrackAtom } from "@/state/player";
import { ForwardIcon, PauseIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

// TODO Test text overflow
// TODO Accent color
// TODO Get artist featuring
// TODO Pause state
// TODO Progress state
// TODO Move spring params to theme

export const MinimisedPlayer = () => {
	const queue = useAtomValue(playlistAtom);
	const queryClient = useQueryClient();
	const cursor = useAtomValue(cursorAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const currentTrack = useMemo(() => {
		return queue[cursor] ?? null;
	}, [queue, cursor]);
	const isVideo = useMemo(() => {
		return currentTrack?.track.type === "Video";
	}, [currentTrack]);
	const onSkip = useCallback(() => {
		skipTrack(queryClient);
	}, [queryClient, skipTrack]);
	const progressWidth = useSharedValue<`${number}%`>(`0%`);
	const progress = currentTrack ? 50 : 0;
	useEffect(() => {
		progressWidth.value = withSpring(`${progress}%`, {
			stiffness: 500,
			damping: 100,
		});
	}, [progress]);

	return (
		<View style={styles.root}>
			<View style={styles.illustration}>
				<Illustration
					illustration={currentTrack?.track.illustration}
					normalizedThumbnail={isVideo}
					variant="center"
					quality={isVideo ? "medium" : "low"}
				/>
			</View>
			<View style={styles.text}>
				<LoadableText
					content={currentTrack?.track.name}
					numberOfLines={1}
					variant="h6"
					skeletonWidth={15}
				/>
				<LoadableText
					content={currentTrack?.artist.name}
					numberOfLines={1}
					variant="body"
					skeletonWidth={15}
				/>
			</View>
			<View style={styles.controls}>
				<Pressable onPress={() => {}}>
					<Icon icon={PauseIcon} />
				</Pressable>

				<Pressable onPress={onSkip}>
					<Icon icon={ForwardIcon} />
				</Pressable>
			</View>
			<Animated.View
				style={[
					{
						width: progressWidth,
					},
					styles.progessPosition,
				]}
			/>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		borderRadius: theme.borderRadius,
		overflow: "hidden",
		gap: theme.gap(1),
		paddingLeft: theme.gap(1), // For consistency
		backgroundColor: theme.colors.background,
		padding: theme.gap(0.75),
		paddingBottom: theme.gap(0.75 + 0.25),
		flexDirection: "row",
	},
	text: { justifyContent: "space-evenly", flex: 1 },
	progessPosition: {
		backgroundColor: theme.colors.text.primary,
		height: theme.gap(1 / 3),
		position: "absolute",
		bottom: 0,
		overflow: "hidden",
		borderBottomEndRadius: theme.borderRadius,
		borderTopEndRadius: theme.borderRadius,
	},

	illustration: {
		height: theme.gap(5.5),
	},
	controls: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(1),
		alignItems: "center",
	},
}));
