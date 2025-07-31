import {
	AlbumIcon,
	ArtistIcon,
	EditIcon,
	type Icon as IconType,
	InfoIcon,
	LyricsIcon,
	PlayAfterIcon,
	PlayIcon,
	PlayNextIcon,
	RelatedTracksIcon,
	SongIcon,
	VideoIcon,
} from "@/ui/icons";
import type { Href } from "expo-router";
export type Action = {
	icon: IconType;
	label: TranslationKey;
	onPress?: () => void;
	href?: Href;
	disabled?: boolean;
};

export const GoToArtist = (artistId: string | number): Action => ({
	label: "actions.goToArtist",
	icon: ArtistIcon,
	href: `/artists/${artistId}`,
});

export const GoToArtistAlbums = (artistId: string | number): Action => ({
	label: "actions.artist.seeAlbums",
	icon: AlbumIcon,
	href: `/albums?artist=${artistId}`,
});

export const GoToArtistSongs = (artistId: string | number): Action => ({
	label: "actions.artist.seeSongs",
	icon: SongIcon,
	href: `/songs?artist=${artistId}`,
});

export const GoToRelease = (releaseId: string | number): Action => ({
	label: "actions.album.goToAlbum",
	icon: AlbumIcon,
	href: `/releases/${releaseId}`,
});

export const ChangeType = (label: TranslationKey, onPress: () => void) => ({
	label,
	onPress,
	nestedModal: true,
	icon: EditIcon,
});

export const Play = (trackId: string | number): Action => ({
	label: "actions.playback.play",
	icon: PlayIcon,
	disabled: true,
	onPress: () => {}, // TODO
});

export const PlayNext = (trackId: string | number): Action => ({
	label: "actions.playback.playNext",
	icon: PlayNextIcon,
	disabled: true,
	onPress: () => {}, // TODO
});

export const PlayAfter = (trackId: string | number): Action => ({
	label: "actions.playback.playAfter",
	icon: PlayAfterIcon,
	disabled: true,
	onPress: () => {}, // TODO
});

export const GoToLyrics = (songId: string | number): Action => ({
	label: "actions.song.seeLyrics",
	href: `/songs/${songId}?tab=lyrics`,
	icon: LyricsIcon,
});

export const GoToSongInfo = (songId: string | number): Action => ({
	label: "actions.song.seeSongInfo",
	href: `/songs/${songId}?tab=infos`,
	icon: InfoIcon,
});

export const GoToSongVideos = (songId: string | number): Action => ({
	label: "actions.song.seeRelatedVideos",
	href: `/videos?song=${songId}`,
	icon: VideoIcon,
});
export const GoToSongVersions = (songId: string | number): Action => ({
	label: "actions.song.seeOtherVersions",
	href: `/songs?versionsOf=${songId}`,
	icon: SongIcon,
});

export const GoToRelatedTracks = (songId: string | number): Action => ({
	label: "actions.song.seeRelatedTracks",
	href: `/tracks?song=${songId}`,
	icon: RelatedTracksIcon,
});
