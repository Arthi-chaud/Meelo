import { getCurrentUserStatus } from "@/api/queries";
import type { SongWithRelations } from "@/models/song";
import {
	InfoIcon,
	LyricsIcon,
	PlayAfterIcon,
	PlayIcon,
	PlayNextIcon,
	RelatedTracksIcon,
	SongIcon,
} from "@/ui/icons";
import formatArtists from "@/utils/format-artists";
import { useCallback } from "react";
import { type Action, ChangeType, GoToArtist, GoToRelease } from "~/actions";
import { useShareSongAction } from "~/actions/share";
import { useQuery, useQueryClient } from "~/api";
import { useChangeSongTypeModal } from "~/components/change-type";
import type { ContextMenuBuilder } from "..";

//TODO add to playlist
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

const GoToTracks = (songId: string | number): Action => ({
	label: "actions.song.seeRelatedTracks",
	href: `/tracks?song=${songId}`,
	icon: RelatedTracksIcon,
});

const Play = (songId: string | number): Action => ({
	label: "actions.playback.play",
	icon: PlayIcon,
	disabled: true,
	onPress: () => {}, // TODO
});

const PlayNext = (songId: string | number): Action => ({
	label: "actions.playback.playNext",
	icon: PlayNextIcon,
	disabled: true,
	onPress: () => {}, // TODO
});

const PlayAfter = (songId: string | number): Action => ({
	label: "actions.playback.playAfter",
	icon: PlayAfterIcon,
	disabled: true,
	onPress: () => {}, // TODO
});

export const useSongContextMenu = (
	song:
		| SongWithRelations<"illustration" | "artist" | "featuring" | "master">
		| undefined,
): ContextMenuBuilder => {
	const ShareAction = useShareSongAction(song?.id);
	const queryClient = useQueryClient();
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
						[Play(song.id)],
						song.master.releaseId
							? [
									GoToArtist(song.artistId),
									GoToRelease(song.master.releaseId),
								]
							: [GoToArtist(song.artistId)],
						[GoToLyrics(song.id), GoToInfo(song.id)],
						[PlayNext(song.id), PlayAfter(song.id)],
						[GoToVersions(song.id), GoToTracks(song.id)],
						user?.admin
							? [
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
