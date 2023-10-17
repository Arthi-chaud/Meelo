import {
	AlbumIcon, ArtistIcon, LyricsIcon,
	RelatedTracksIcon, SearchIcon,
	SettingsIcon, SongIcon
} from "../icons";
import { NextRouter } from "next/router";
import Action from "./action";

export const GoToSongLyricsAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/lyrics`,
	label: 'seeLyrics',
	icon: <LyricsIcon/>
});

export const GoToArtistAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}`,
	label: 'goToArtist',
	icon: <ArtistIcon/>
});

export const GoToArtistAlbumsAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}/albums`,
	label: 'seeAlbums',
	icon: <AlbumIcon/>
});

export const GoToArtistSongsAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}/songs`,
	label: 'seeSongs',
	icon: <SongIcon/>
});

export const GoToAlbumAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}`,
	label: 'goToAlbum',
	icon: <AlbumIcon/>
});

export const GoToReleaseAction = (releaseIdentifier: string | number): Action => ({
	href: `/releases/${releaseIdentifier}`,
	label: 'goToAlbum',
	icon: <AlbumIcon/>
});

export const GoToReleaseAsyncAction = (router: NextRouter, albumIdentifier: () => PromiseLike<number | string>): Action => ({
	onClick: () => albumIdentifier().then((id) => router.push(`/releases/${id}`)),
	label: 'goToAlbum',
	icon: <AlbumIcon/>
});

export const GoToSongVersionAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/versions`,
	label: 'seeOtherVersions',
	icon: <AlbumIcon/>
});

export const GoToRelatedTracksAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/tracks`,
	label: 'seeRelatedTracks',
	icon: <RelatedTracksIcon/>
});

export const GoToSearchAction = {
	label: 'search',
	icon: <SearchIcon/>,
	href: '/search',
} as const;

export const GoToSettingsAction: Action = {
	label: 'settings',
	icon: <SettingsIcon/>,
	href: '/settings',
};

