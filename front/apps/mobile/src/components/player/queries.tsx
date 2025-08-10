import { getSong, getTrack } from "@/api/queries";

export const getSongWithLyrics = (songId: number) =>
	getSong(songId, ["lyrics"]);

export const getTrackForContextMenu = (trackId: number) =>
	getTrack(trackId, ["song", "video", "release", "illustration"]);
