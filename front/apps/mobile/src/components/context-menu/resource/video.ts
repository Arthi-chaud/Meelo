import { useCallback } from "react";
import { getCurrentUserStatus } from "@/api/queries";
import type { VideoWithRelations } from "@/models/video";
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

//TODO Track info

export const useVideoContextMenu = (
	video: VideoWithRelations<"illustration" | "master" | "artist"> | undefined,
): ContextMenuBuilder => {
	const { data: user } = useQuery(getCurrentUserStatus);
	const { openChangeTypeModal } = useChangeVideoTypeModal(video);
	return useCallback(() => {
		const trackToPlay = video
			? {
					artist: video.artist,
					track: {
						...video.master,
						illustration: video.illustration,
					},
				}
			: undefined;
		return {
			header: {
				title: video?.name,
				subtitle: video?.artist.name,
				illustration: video?.illustration,
				illustrationProps: {
					normalizedThumbnail: true,
					useBlurhash: true,
				},
			},
			items: video
				? [
						trackToPlay ? [Play(trackToPlay)] : [],
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
						trackToPlay
							? [PlayNext(trackToPlay), PlayAfter(trackToPlay)]
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
