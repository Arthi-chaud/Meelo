import { getCurrentUserStatus } from "@/api/queries";
import type { SongWithRelations } from "@/models/song";
import formatArtists from "@/utils/format-artists";
import { useCallback } from "react";
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
	SetAsMaster,
} from "~/actions";
import { useShareSongAction } from "~/actions/share";
import { useQuery } from "~/api";
import { useChangeSongTypeModal } from "~/components/change-type";
import type { ContextMenuBuilder } from "..";

//TODO add to playlist
//TODO Track info

export const useSongContextMenu = (
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring" | "master">
		| undefined,
): ContextMenuBuilder => {
	const ShareAction = useShareSongAction(song?.id);
	const { data: user } = useQuery(getCurrentUserStatus);
	const { openChangeTypeModal } = useChangeSongTypeModal(song);
	return useCallback(() => {
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
						song.masterId ? [Play(song.masterId)] : [],
						song.master.releaseId
							? [
									GoToArtist(song.artistId),
									GoToRelease(song.master.releaseId),
								]
							: [GoToArtist(song.artistId)],
						[GoToLyrics(song.id), GoToSongInfo(song.id)],
						song.masterId
							? [
									PlayNext(song.masterId),
									PlayAfter(song.masterId),
								]
							: [],
						[
							GoToSongVersions(song.id),
							GoToSongVideos(song.id),
							GoToRelatedTracks(song.id),
						],
						user?.admin
							? [
									// ...(song.masterId !== song.master.id
									// 	? [SetAsMaster(() => {}, false)]
									// 	: []),
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
