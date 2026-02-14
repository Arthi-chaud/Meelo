import { useAtom } from "jotai";
import { useMemo } from "react";
import { getRelease, getSong, getSongs, getVideo } from "@/api/queries";
import { useInfiniteQuery, useQuery } from "~/api";
import { currentTrackAtom } from "~/components/player/state";

// Returns an album cover that's closely related to the video
export const useVideoIllustration = () => {
	const [video] = useAtom(currentTrackAtom);
	if (!video) {
		return null;
	}
	const { data: release } = useQuery(
		(releaseId) => getRelease(releaseId, ["illustration"]),
		video.track.releaseId ?? undefined,
	);
	const { data: parentVideo } = useQuery(
		(videoId) => getVideo(videoId, ["master"]),
		video.track.videoId ?? undefined,
	);
	const { data: masterVideoRelease } = useQuery(
		(releaseId) => getRelease(releaseId, ["illustration"]),
		parentVideo?.master.releaseId ?? undefined,
	);
	const { data: parentSong } = useQuery(
		(songId) => getSong(songId, ["illustration", "master"]),
		parentVideo?.songId ?? undefined,
	);

	const { items: parentSongVersions } = useInfiniteQuery(
		(songId) =>
			getSongs({ versionsOf: songId }, undefined, [
				"illustration",
				"master",
			]),
		parentVideo?.songId ?? undefined,
	);
	return useMemo(() => {
		if (release?.illustration) {
			return release.illustration;
		}
		if (!masterVideoRelease && !parentSong) {
			return undefined;
		}
		if (masterVideoRelease) {
			return masterVideoRelease.illustration;
		}
		if (!parentSong) {
			return undefined;
		}
		if (parentSong.master.type === "Audio") {
			return parentSong.illustration;
		}
		const relatedSongs = parentSongVersions?.filter(
			(s) => s.id !== parentSong.id && s.master.type === "Audio",
		);
		if (relatedSongs === undefined) {
			return undefined;
		}
		if (relatedSongs.length === 0) {
			return null;
		}
		return relatedSongs[0].illustration;
	}, [video, release, masterVideoRelease, parentSong, parentSongVersions]);
};
