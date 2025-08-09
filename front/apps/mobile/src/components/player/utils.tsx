import { useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import { getSong } from "@/api/queries";
import formatArtists from "@/utils/format-artists";
import { useQuery } from "~/api";
import { currentTrackAtom } from "./state";

export const ColorBackground = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const firstIllustrationColor = useMemo(
		() => currentTrack?.track.illustration?.colors.at(0) ?? undefined,
		[currentTrack],
	);
	const animatedTheme = useAnimatedTheme();
	const backgroundColorSV = useSharedValue("transparent");
	useEffect(() => {
		backgroundColorSV.value = withSpring(
			firstIllustrationColor ?? "transparent",
			animatedTheme.value.animations.fades,
		);
	}, [firstIllustrationColor]);
	const backgroundStyle = useAnimatedStyle(
		() => ({ backgroundColor: backgroundColorSV.value }),
		[firstIllustrationColor],
	);
	return <Animated.View style={[styles.background, backgroundStyle]} />;
};

const ColorBackgroundOpacity = 0.3;

const styles = StyleSheet.create(() => ({
	background: {
		...StyleSheet.absoluteFillObject,
		opacity: ColorBackgroundOpacity,
	},
}));
export const useFormattedArtistName = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const { data: song } = useQuery(
		(songId) => getSong(songId, ["artist", "featuring"]),
		currentTrack?.track.songId ?? undefined,
	);
	return useMemo(() => {
		if (song) {
			return formatArtists(song.artist, song.featuring);
		}
		if (currentTrack) {
			return currentTrack.artist.name;
		}
		return undefined;
	}, [currentTrack, song]);
};
