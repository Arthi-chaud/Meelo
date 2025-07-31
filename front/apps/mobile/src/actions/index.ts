import {
	AlbumIcon,
	ArtistIcon,
	EditIcon,
	SongIcon,
	type Icon as IconType,
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
