import type { SongWithRelations } from "@/models/song";
import { InfoIcon, LyricsIcon, SongIcon } from "@/ui/icons";
import formatArtists from "@/utils/format-artists";
import { useCallback } from "react";
import { type Action, GoToArtist } from "~/actions";
import { useShareSongAction } from "~/actions/share";
import type { ContextMenuBuilder } from "..";

//TODO Play
//TODO Play after/next
//TODO add to playlist
//TODO see other tracks
//TODO Change type if admin
//TODO Track info

const GoToLyrics = (songId: string | number): Action => ({
	label: "actions.song.seeLyrics",
	href: `/songs/${songId}?tab=lyrics`,
	icon: LyricsIcon,
});
const GoToInfo = (songId: string | number): Action => ({
	label: "actions.song.seeSongInfo",
	href: `/songs/${songId}?tab=infos`,
	icon: InfoIcon,
});
const GoToVersions = (songId: string | number): Action => ({
	label: "actions.song.seeOtherVersions",
	href: `/songs?versionsOf=${songId}`,
	icon: SongIcon,
});

export const useSongContextMenu = (
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring">
		| undefined,
): ContextMenuBuilder => {
	const ShareAction = useShareSongAction(song?.id);
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
						[GoToArtist(song.artistId)],
						[GoToLyrics(song.id), GoToInfo(song.id)],
						[GoToVersions(song.id)],
						ShareAction ? [ShareAction] : [],
					]
				: [],
		};
	}, [song]);
};
