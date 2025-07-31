import { getCurrentUserStatus } from "@/api/queries";
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
} from "~/actions";
import { useQuery } from "~/api";
import { useChangeVideoTypeModal } from "~/components/change-type";
import type { ContextMenuBuilder } from "..";
import type { VideoWithRelations } from "@/models/video";

//TODO Track info

export const useVideoContextMenu = (
	video:
		| VideoWithRelations<"illustration" | "song" | "master" | "artist">
		| undefined,
): ContextMenuBuilder => {
	const { data: user } = useQuery(getCurrentUserStatus);
	const { openChangeTypeModal } = useChangeVideoTypeModal(video);
	return useCallback(() => {
		return {
			header: {
				title: video?.name,
				subtitle: video?.artist.name,
				illustration: video?.illustration,
			},
			items: video
				? [
						video.masterId ? [Play(video.masterId)] : [],
						video.master.releaseId
							? [
									GoToArtist(video.artistId),
									GoToRelease(video.master.releaseId),
								]
							: [GoToArtist(video.artistId)],
						video.songId
							? [
									GoToLyrics(video.songId),
									GoToSongInfo(video.songId),
								]
							: [],
						video.masterId
							? [
									PlayNext(video.masterId),
									PlayAfter(video.masterId),
								]
							: [],
						video.songId
							? [
									GoToSongVersions(video.songId),
									GoToSongVideos(video.songId),
									GoToRelatedTracks(video.songId),
								]
							: [],
						user?.admin
							? [
									ChangeType(
										"actions.video.changeType",
										openChangeTypeModal,
									),
								]
							: [],
					]
				: [],
		};
	}, [video]);
};
