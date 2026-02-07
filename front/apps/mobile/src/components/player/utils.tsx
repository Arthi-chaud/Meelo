import { useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { getSong } from "@/api/queries";
import formatArtists from "@/utils/format-artists";
import { useQuery } from "~/api";
import { animations } from "~/theme";
import { currentTrackAtom } from "./state";

export const ColorBackground = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const firstIllustrationColor = useMemo(
		() => currentTrack?.track.illustration?.colors.at(0) ?? undefined,
		[currentTrack],
	);
	const backgroundColorSV = useSharedValue("transparent");
	useEffect(() => {
		backgroundColorSV.value = withSpring(
			firstIllustrationColor ?? "transparent",
			animations.fades,
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
		(songId) => getSong(songId, ["featuring"]),
		currentTrack?.featuring === undefined
			? (currentTrack?.track.songId ?? undefined)
			: undefined,
	);
	return useMemo(() => {
		if (!currentTrack) {
			return undefined;
		}
		return formatArtists(
			currentTrack.artist,
			currentTrack.featuring ?? song?.featuring,
		);
	}, [currentTrack, song]);
};
