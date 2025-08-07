import { useCallback } from "react";
import { getArtist, getCurrentUserStatus } from "@/api/queries";
import type { TrackWithRelations } from "@/models/track";
import type { TrackState } from "@/state/player";
import {
	type Action,
	ChangeType,
	GoToArtist,
	GoToLyrics,
	GoToRelatedTracks,
	GoToRelease,
	GoToSongInfo,
	GoToSongVersions,
	Play,
	PlayAfter,
	PlayNext,
} from "~/actions";
import { useSetSongTrackAsMaster } from "~/actions/master";
import { useQuery, useQueryClient } from "~/api";
import {
	useChangeSongTypeModal,
	useChangeVideoTypeModal,
} from "~/components/change-type";
import type { ContextMenuBuilder } from "..";

export const useTrackContextMenu = (
	track:
		| TrackWithRelations<"illustration" | "song" | "video" | "release">
		| undefined,
): ContextMenuBuilder => {
	const queryClient = useQueryClient();
	const { data: user } = useQuery(getCurrentUserStatus);
	const { openChangeTypeModal: openChangeSongTypeModal } =
		useChangeSongTypeModal(track?.song ?? undefined);
	const { openChangeTypeModal: openChangeVideoTypeModal } =
		useChangeVideoTypeModal(track?.video ?? undefined);
	const SetAsSongMaster = useSetSongTrackAsMaster(
		track,
		track?.song ?? undefined,
	);

	return useCallback(() => {
		const songOrVideo = track?.song ?? track?.video;
		const resolveTrackWithArtist =
			songOrVideo && track
				? () =>
						queryClient
							.fetchQuery(getArtist(songOrVideo.artistId))
							.then((artist) => ({ artist, track }))
				: undefined;
		return {
			header: {
				title: track?.name,
				subtitle: track?.release?.name,
				illustration: track?.illustration,
			},
			items: track
				? [
						resolveTrackWithArtist
							? [AttachResolver(Play, resolveTrackWithArtist)]
							: [],
						track.releaseId
							? [
									GoToArtist(songOrVideo!.artistId),
									GoToRelease(track.releaseId),
								]
							: [GoToArtist(songOrVideo!.artistId)],
						track.songId
							? [GoToLyrics(track.id), GoToSongInfo(track.id)]
							: [],
						resolveTrackWithArtist
							? [
									AttachResolver(
										PlayNext,
										resolveTrackWithArtist,
									),
									AttachResolver(
										PlayAfter,
										resolveTrackWithArtist,
									),
								]
							: [],
						track.songId
							? [
									GoToSongVersions(track.songId),
									GoToRelatedTracks(track.songId),
								]
							: [],
						user?.admin
							? [
									...(track.song
										? [
												SetAsSongMaster,
												ChangeType(
													"actions.song.changeType",
													openChangeSongTypeModal,
												),
											]
										: []),

									...(track.video
										? [
												ChangeType(
													"actions.video.changeType",
													openChangeVideoTypeModal,
												),
											]
										: []),
								]
							: [],
					]
				: [],
		};
	}, [track]);
};

const AttachResolver = (
	actionFn: (track: TrackState) => Action,
	resolver: () => Promise<TrackState>,
): Action => ({
	...actionFn(undefined as any),
	onPress: () => resolver().then((r) => actionFn(r).onPress?.()),
});
