import {
	AlbumOutlined, Difference, Lyrics, Search, Settings
} from "@mui/icons-material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Album from "@mui/icons-material/Album";
import Audiotrack from '@mui/icons-material/Audiotrack';
import { NextRouter } from "next/router";
import Action from "./action";

export const GoToSongLyricsAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/lyrics`,
	label: 'seeLyrics',
	icon: <Lyrics/>
});

export const GoToArtistAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}`,
	label: 'goToArtist',
	icon: <AccountCircle/>
});

export const GoToArtistAlbumsAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}/albums`,
	label: 'seeAlbums',
	icon: <Album/>
});

export const GoToArtistSongsAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}/songs`,
	label: 'seeSongs',
	icon: <Audiotrack/>
});

export const GoToAlbumAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}`,
	label: 'goToAlbum',
	icon: <Album/>
});

export const GoToReleaseAction = (releaseIdentifier: string | number): Action => ({
	href: `/releases/${releaseIdentifier}`,
	label: 'goToAlbum',
	icon: <Album/>
});

export const GoToReleaseAsyncAction = (router: NextRouter, albumIdentifier: () => PromiseLike<number | string>): Action => ({
	onClick: () => albumIdentifier().then((id) => router.push(`/releases/${id}`)),
	label: 'goToAlbum',
	icon: <Album/>
});

export const GoToAlbumReleasesAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}/releases`,
	label: 'seeReleases',
	icon: <AlbumOutlined/>
});

export const GoToSongVersionAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/versions`,
	label: 'seeOtherVersions',
	icon: <Audiotrack/>
});

export const GoToRelatedTracksAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/tracks`,
	label: 'seeRelatedTracks',
	icon: <Difference/>
});

export const GoToSearchAction = {
	label: 'search',
	icon: <Search/>,
	href: '/search',
} as const;

export const GoToSettingsAction: Action = {
	label: 'settings',
	icon: <Settings/>,
	href: '/settings',
};

