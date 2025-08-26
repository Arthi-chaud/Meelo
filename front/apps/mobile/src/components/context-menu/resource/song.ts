import { useCallback } from "react";
import { getCurrentUserStatus } from "@/api/queries";
import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import {
	ChangeType,
	GoToArtist,
	GoToLyrics,
	GoToRelatedTracks,
	GoToRelease,
	GoToSongInfo,
	GoToSongVersions,
	GoToSongVideos,
	Play,
	PlayAfter,
	PlayNext,
} from "~/actions";
import { useSetSongTrackAsMaster } from "~/actions/master";
import { useShareSongAction } from "~/actions/share";
import { SeeTrackInfo, useTrackInfoModal } from "~/actions/track-info";
import { useQuery } from "~/api";
import { useChangeSongTypeModal } from "~/components/change-type";
import type { ContextMenuBuilder } from "..";

//TODO add to playlist

export const useSongContextMenu = (
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring" | "master">
		| undefined,
): ContextMenuBuilder => {
	const ShareAction = useShareSongAction(song?.id);
	const { data: user } = useQuery(getCurrentUserStatus);
	const { openChangeTypeModal } = useChangeSongTypeModal(song);
	const { openTrackInfoModal } = useTrackInfoModal(song?.masterId);
	const SetAsMaster = useSetSongTrackAsMaster(song?.master, song);
	return useCallback(() => {
		const trackToPlay = song
			? {
					track: {
						...song.master,
						illustration: song.illustration,
					},
					artist: song.artist,
				}
			: undefined;
		return {
			header: {
				title: song?.name,
				subtitle: song
					? formatArtists(song.artist, song.featuring)
					: undefined,
				illustration: song?.illustration,
			},
			items: song
				? [
						trackToPlay ? [Play(trackToPlay)] : [],
						song.master.releaseId
							? [
									GoToArtist(song.artistId),
									GoToRelease(song.master.releaseId),
								]
							: [GoToArtist(song.artistId)],
						[
							GoToLyrics(song.id),
							GoToSongInfo(song.id),
							...(song.masterId
								? [SeeTrackInfo(openTrackInfoModal)]
								: []),
						],
						trackToPlay
							? [PlayNext(trackToPlay), PlayAfter(trackToPlay)]
							: [],
						[
							GoToSongVersions(song.id),
							GoToSongVideos(song.id),
							GoToRelatedTracks(song.id),
						],
						user?.admin
							? [
									//Note: this happens in the tracklist when we pass the master as a release's track.
									// Allowing this allows not having to write a context menu for release tracks
									...(song.masterId !== song.master.id
										? [SetAsMaster]
										: []),
									ChangeType(
										"actions.song.changeType",
										openChangeTypeModal,
									),
								]
							: [],
						ShareAction ? [ShareAction] : [],
					]
				: [],
		};
	}, [song]);
};
