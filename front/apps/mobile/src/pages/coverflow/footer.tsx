import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, type ViewStyle } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { BackIcon, PauseIcon, PlayIcon } from "@/ui/icons";
import { formatArtists_ } from "@/utils/format-artists";
import { Illustration } from "~/components/illustration";
import { usePickArtistModal } from "~/components/pick-artist";
import {
	currentTrackAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
} from "~/components/player/state";
import { Button } from "~/primitives/button";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { animations } from "~/theme";
import type { AlbumT } from "./utils";

type Props = {
	selectedItem: AlbumT | undefined;
	style: ViewStyle;
	isScrolling: boolean;
};

export const Footer = ({ selectedItem, isScrolling, style }: Props) => {
	const textOpacity = useSharedValue(isScrolling ? 0 : 1);
	const router = useRouter();
	useEffect(() => {
		textOpacity.value = withTiming(isScrolling ? 0 : 1, animations.fades);
	}, [isScrolling]);
	return (
		<View style={[styles.root, style]}>
			<Button
				icon={BackIcon}
				variant="text"
				onPress={() => router.back()}
			/>
			<Animated.View style={[{ opacity: textOpacity }]}>
				{selectedItem && (
					<SelectedItemText selectedItem={selectedItem} />
				)}
			</Animated.View>
			<NowPlaying />
		</View>
	);
};

const NowPlaying = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const isPlaying = useAtomValue(isPlayingAtom);
	const pause = useSetAtom(pauseAtom);
	const play = useSetAtom(playAtom);

	return (
		<Pressable
			style={styles.nowPlaying}
			disabled={!currentTrack}
			onPress={() => (isPlaying ? pause() : play())}
		>
			<View style={styles.nowPlayingButton}>
				<Icon
					icon={isPlaying ? PauseIcon : PlayIcon}
					style={styles.nowPlayingIcon}
				/>
			</View>
			<Illustration
				variant="center"
				illustration={currentTrack?.track.illustration ?? null}
				quality="low"
			/>
		</Pressable>
	);
};

const SelectedItemText = ({ selectedItem }: { selectedItem: AlbumT }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const { openModal: openPickArtistModal } = usePickArtistModal(
		selectedItem?.artists,
	);
	return (
		<View style={styles.text}>
			<Pressable
				onPress={() => {
					router.replace(`/releases/${selectedItem.masterId}`);
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
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: theme.gap(2),
	},
	text: {
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	nowPlaying: {
		justifyContent: "center",
		alignItems: "center",
		height: theme.gap(5.5),
	},
	nowPlayingIcon: { color: theme.colors.text.onAccentSurface },
	nowPlayingButton: {
		borderRadius: theme.borderRadius,
		backgroundColor: "black",
		opacity: 0.5,
		position: "absolute",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		height: "100%",
		zIndex: 2,
	},
}));
