import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Disc } from "@/models/disc";
import type { TracklistItemWithRelations } from "@/models/tracklist";
import { PlayIcon, VideoIcon } from "@/ui/icons";
import { formatDiscName } from "@/ui/pages/release";
import formatArtists from "@/utils/format-artists";
import formatDuration from "@/utils/format-duration";
import { ContextMenuButton, useContextMenu } from "~/components/context-menu";
import { useSongContextMenu } from "~/components/context-menu/resource/song";
import { useVideoContextMenu } from "~/components/context-menu/resource/video";
import { LoadableText } from "~/components/loadable_text";
import { currentTrackAtom } from "~/components/player/state";
import * as Haptics from "~/haptics";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

export type TrackType = TracklistItemWithRelations<
	"artist" | "illustration" | "featuring"
>;
export const TrackItem = ({
	track,
	onPress,
	maxTrackIndex,
	albumArtistId,
}: {
	track: TrackType | undefined;
	maxTrackIndex: number;
	onPress: () => void;
	albumArtistId: number | null | undefined;
}) => {
	const currentTrack = useAtomValue(currentTrackAtom);
	//Note: Instead of using track context menu
	//We build back songs and videos from the track
	const songWithTrack = useMemo(() => {
		if (!track?.song) {
			return undefined;
		}
		return {
			...track.song,
			master: track,
			illustration: track.illustration,
		};
	}, [track]);

	const videoWithTrack = useMemo(() => {
		if (!track?.video) {
			return undefined;
		}
		return {
			...track.video,
			master: track,
			illustration: track.illustration,
		};
	}, [track]);
	const songContextMenu = useSongContextMenu(songWithTrack);
	const videoContextMenu = useVideoContextMenu(videoWithTrack);
	const contextMenu = useMemo(() => {
		if (!track) {
			return undefined;
		}
		if (videoWithTrack) {
			return videoContextMenu;
		}
		return songContextMenu;
	}, [songWithTrack, videoWithTrack, videoContextMenu, songContextMenu]);
	const { openContextMenu } = useContextMenu(contextMenu);
	const onLongPress = useCallback(() => {
		if (contextMenu) {
			openContextMenu();
			Haptics.onContextMenuOpen();
		}
	}, [contextMenu, openContextMenu]);
	return (
		<Pressable
			disabled={track === undefined}
			style={styles.trackButton}
			onLongPress={onLongPress}
			onPress={onPress}
		>
			<View style={styles.trackIndex(maxTrackIndex)}>
				{track && track.id === currentTrack?.track.id ? (
					<View style={styles.isPlayingIconContainer}>
						<Icon icon={PlayIcon} style={styles.leadingIcon} />
					</View>
				) : track?.type === "Video" ? (
					<View style={styles.trackVideoIconContainer}>
						<Icon icon={VideoIcon} style={styles.leadingIcon} />
					</View>
				) : (
					<LoadableText
						numberOfLines={1}
						skeletonWidth={2}
						content={
							track
								? (track.trackIndex?.toString() ?? " ")
								: undefined
						}
						color="secondary"
					/>
				)}
			</View>
			<View style={styles.trackLabel}>
				<LoadableText
					content={track?.name}
					skeletonWidth={10}
					numberOfLines={1}
					variant="body"
				/>
				{(track?.song ?? track?.video) !== undefined &&
					albumArtistId !== undefined &&
					((track?.song ?? track?.video)!.artistId !==
						albumArtistId ||
						(track?.song?.featuring.length ?? 0) > 0) && (
						<LoadableText
							content={
								track?.song
									? formatArtists(
											track.song.artist,
											track.song.featuring,
											albumArtistId
												? { id: albumArtistId }
												: undefined,
										)
									: track?.video?.artist.name
							}
							numberOfLines={1}
							skeletonWidth={10}
							color="secondary"
							variant="body"
						/>
					)}
			</View>
			<View>
				<LoadableText
					content={track ? formatDuration(track.duration) : undefined}
					skeletonWidth={UnknownDurationPlaceholderLength}
					color="secondary"
				/>
			</View>
			<View>
				{contextMenu && <ContextMenuButton builder={contextMenu} />}
			</View>
		</Pressable>
	);
};

const UnknownDurationPlaceholderLength = formatDuration(null).length;

export const DiscDivider = ({
	discName,
	discs,
	onPress,
}: {
	discName: string;
	discs: Disc[];
	onPress: () => void;
}) => {
	const { t } = useTranslation();
	return (
		<View style={styles.discLabel}>
			<Pressable onPress={onPress}>
				<LoadableText
					variant="subtitle"
					skeletonWidth={6}
					content={formatDiscName(discName, discs, t)}
				/>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	discLabel: {
		flexDirection: "row",
		paddingTop: theme.gap(1.5),
		paddingBottom: theme.gap(0.5),
		paddingHorizontal: theme.gap(1),
	},
	tracks: {
		paddingBottom: theme.gap(2),
	},
	leadingIcon: {
		color: theme.colors.text.secondary,
		size: theme.fontSize.rem(1.4),
	},
	trackVideoIconContainer: {
		// This override the gap of trackButton
		// Allowing to make the icon appear more centered
		marginRight: theme.gap(-1),
	},
	isPlayingIconContainer: {
		marginRight: theme.gap(-0.5),
	},
	trackButton: {
		width: "100%",
		flexDirection: "row",
		gap: theme.gap(1),
		alignItems: "center",
		paddingVertical: theme.gap(1.5),
	},
	trackIndex: (maxTrackIndex: number) => ({
		marginRight: theme.gap(1),
		alignItems: "flex-end",
		justifyContent: "center",
		// TODO the .5 is arbitrary
		width:
			theme.fontSize.default *
			(Math.max(maxTrackIndex.toString().length, 2) - 0.5),
	}),
	trackLabel: {
		flex: 1,
		gap: theme.gap(1),
		justifyContent: "center",
	},
}));
