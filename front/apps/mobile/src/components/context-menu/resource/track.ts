import { useCallback } from "react";
import { getCurrentUserStatus } from "@/api/queries";
import type { TrackWithRelations } from "@/models/track";
import {
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
import { useQuery } from "~/api";
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
		return {
			header: {
				title: track?.name,
				subtitle: track?.release?.name,
				illustration: track?.illustration,
			},
			items: track
				? [
						track.id ? [Play(track.id)] : [],
						track.releaseId
							? [
									GoToArtist(songOrVideo!.artistId),
									GoToRelease(track.releaseId),
								]
							: [GoToArtist(songOrVideo!.artistId)],
						track.songId
							? [GoToLyrics(track.id), GoToSongInfo(track.id)]
							: [],
						[PlayNext(track.id), PlayAfter(track.id)],
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
