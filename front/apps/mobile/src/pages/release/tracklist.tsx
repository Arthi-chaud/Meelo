import { useAtomValue, useSetAtom } from "jotai";
import { Fragment, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { RequireAtLeastOne } from "type-fest";
import type { Disc } from "@/models/disc";
import type { SongWithRelations } from "@/models/song";
import type { TrackWithRelations } from "@/models/track";
import type TracklistType from "@/models/tracklist";
import type { VideoWithRelations } from "@/models/video";
import {
	cursorAtom,
	playlistAtom,
	playTracksAtom,
	type TrackState,
} from "@/state/player";
import { PlayIcon, VideoIcon } from "@/ui/icons";
import { formatDiscName } from "@/ui/pages/release";
import formatArtists from "@/utils/format-artists";
import formatDuration from "@/utils/format-duration";
import { generateArray } from "@/utils/gen-list";
import { ContextMenuButton, useContextMenu } from "~/components/context-menu";
import { useSongContextMenu } from "~/components/context-menu/resource/song";
import { useVideoContextMenu } from "~/components/context-menu/resource/video";
import { LoadableText } from "~/components/loadable_text";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { TextSkeleton } from "~/primitives/text";

type TrackType = TrackWithRelations<"illustration"> &
	RequireAtLeastOne<{
		song: SongWithRelations<"artist" | "featuring">;
		video: VideoWithRelations<"artist">;
	}>;

const SkeletonTracklist = {
	disc: generateArray(10, undefined),
} satisfies TracklistType<TrackType | undefined>;

export const Tracklist = ({
	tracklist,
	discs,
	tracks,
	albumArtistId,
}: {
	albumArtistId: number | undefined | null;
	discs: Disc[] | undefined;
	tracks: TrackState[] | undefined;
	tracklist: TracklistType<TrackType | undefined> | undefined;
}) => {
	const playTracks = useSetAtom(playTracksAtom);
	const { t } = useTranslation();
	const maxTrackIndex = useMemo(() => {
		return tracks?.length
			? Math.max(...tracks.map(({ track }) => track.trackIndex ?? 0))
			: 10;
	}, [tracks]);
	const showDiscName = useMemo(() => {
		if (!tracklist) {
			return false;
		}
		return Object.keys(tracklist).length > 1;
	}, [tracklist]);
	const playDisc = useCallback(
		(discIndex: string) => {
			if (!tracklist) {
				return;
			}
			const discTracks = tracklist[discIndex]
				.filter((t) => t !== undefined)
				.map(({ song, video, ...track }) => ({
					track,
					artist: (song ?? video)!.artist,
				}));
			playTracks({ tracks: discTracks });
		},
		[tracklist],
	);
	// Callback on tracklist item press
	// Will add all the other tracks to the queue
	const playTrack = useCallback(
		(trackId: number) => {
			if (!tracks) {
				return;
			}
			const cursor = tracks.findIndex(
				({ track }) => track.id === trackId,
			);
			playTracks({ tracks, cursor });
		},
		[tracks],
	);
	return (
		<View style={styles.root}>
			{Object.entries(tracklist ?? SkeletonTracklist).map(
				([discName, tracks]) => {
					return (
						<Fragment key={discName}>
							{showDiscName && (
								<View key={discName} style={styles.discLabel}>
									<Pressable
										disabled={!tracklist}
										onPress={() => {
											playDisc(discName);
										}}
									>
										<LoadableText
											variant="subtitle"
											skeletonWidth={6}
											content={
												!tracklist
													? undefined
													: formatDiscName(
															discName,
															discs,
															t,
														)
											}
										/>
									</Pressable>
								</View>
							)}
							<View style={styles.tracks}>
								{tracks.map((track, idx) => (
									<Fragment key={idx}>
										<TrackItem
											track={track}
											onPress={() =>
												track && playTrack(track.id)
											}
											albumArtistId={albumArtistId}
											maxTrackIndex={maxTrackIndex}
										/>
										{/* TODO I dont like that the divier isn't centered with the track name */}
										<Divider h withInsets />
									</Fragment>
								))}
							</View>
						</Fragment>
					);
				},
			)}
		</View>
	);
};

const TrackItem = ({
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
	const playlist = useAtomValue(playlistAtom);
	const cursor = useAtomValue(cursorAtom);
	const currentPlayingTrackId: number | null = useMemo(
		() => playlist[cursor]?.track.id || null,
		[playlist, cursor],
	);
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
	return (
		<Pressable
			disabled={track === undefined}
			style={styles.trackButton}
			onLongPress={contextMenu ? openContextMenu : undefined}
			onPress={onPress}
		>
			<View style={styles.trackIndex(maxTrackIndex)}>
				{track && track.id === currentPlayingTrackId ? (
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
				{contextMenu ? (
					<ContextMenuButton builder={contextMenu} />
				) : (
					<TextSkeleton width={4} />
				)}
			</View>
		</Pressable>
	);
};

const UnknownDurationPlaceholderLength = formatDuration(null).length;

const styles = StyleSheet.create((theme) => ({
	root: {
		paddingTop: theme.gap(2),
		// To compensate the bottomPadding of 'tracks' style
		paddingBottom: theme.gap(1),
	},
	discLabel: {
		flexDirection: "row",
		paddingBottom: theme.gap(1),
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
