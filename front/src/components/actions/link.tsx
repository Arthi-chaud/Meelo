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
	label: 'See Lyrics',
	icon: <Lyrics/>
});

export const GoToArtistAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}`,
	label: 'Go to Artist',
	icon: <AccountCircle/>
});

export const GoToArtistAlbumsAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}/albums`,
	label: 'See Albums',
	icon: <Album/>
});

export const GoToArtistSongsAction = (artistIdentifier: string | number): Action => ({
	href: `/artists/${artistIdentifier}/songs`,
	label: 'See Songs',
	icon: <Audiotrack/>
});

export const GoToAlbumAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}`,
	label: 'Go To Album',
	icon: <Album/>
});

export const GoToReleaseAction = (releaseIdentifier: string | number): Action => ({
	href: `/releases/${releaseIdentifier}`,
	label: 'Go To Album',
	icon: <Album/>
});

export const GoToReleaseAsyncAction = (router: NextRouter, albumIdentifier: () => PromiseLike<number | string>): Action => ({
	onClick: () => albumIdentifier().then((id) => router.push(`/releases/${id}`)),
	label: 'Go To Album',
	icon: <Album/>
});

export const GoToAlbumReleasesAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}/releases`,
	label: 'See Releases',
	icon: <AlbumOutlined/>
});

export const GoToSongVersionAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/versions`,
	label: 'See Other Versions',
	icon: <Audiotrack/>
});

export const GoToRelatedTracksAction = (songIdentifier: string | number): Action => ({
	href: `/songs/${songIdentifier}/tracks`,
	label: 'See Related Tracks',
	icon: <Difference/>
});

export const GoToSearchAction = {
	label: 'Search',
	icon: <Search/>,
	href: '/search',
};

export const GoToSettingsAction: Action = {
	label: 'Settings',
	icon: <Settings/>,
	href: '/settings',
};

export default Action;
