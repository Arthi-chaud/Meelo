import { AlbumOutlined, Difference, Download, Lyrics, PlaylistAdd, PlaylistPlay } from "@mui/icons-material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Album from "@mui/icons-material/Album";
import Audiotrack from '@mui/icons-material/Audiotrack';
import Share from "@mui/icons-material/Share";
import { NextRouter, Router } from "next/router";
import { toast } from "react-hot-toast";
import API from "../../api";
import { playAfter, playNext } from "../../state/playerSlice";
import store from "../../state/store";
import copyLinkToClipboard from "../../utils/copy-link";
import downloadAction from "../download-action";

/**
 * Props for a generic component to run an action/go to page
 */
type Action = {
	href?: string;
	disabled?: boolean;
	onClick?: () => void;
	label: string;
	icon?: JSX.Element;
}

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

export const ShareAction = (url: string): Action => ({
	onClick: () => copyLinkToClipboard(url),
	label: 'Share',
	icon: <Share/>
});


export const PlayNextAction = (getTrack: () => PromiseLike<Parameters<typeof playNext>[0]>): Action => ({
	onClick: () => getTrack().then((track) => {
		store.dispatch(playNext(track))
		toast.success(`'${track.track.name}' will play next!`, {
			duration: 2000
		})
	}),
	label: "Play Next",
	icon: <PlaylistPlay/>
});

export const PlayAfterAction = (getTrack: () => PromiseLike<Parameters<typeof playAfter>[0]>): Action => ({
	onClick: () => getTrack().then((track) => {
		store.dispatch(playAfter(track))
		toast.success(`'${track.track.name}' will play after!`, {
			duration: 2000
		})
	}),
	label: "Play After",
	icon: <PlaylistAdd/>
})


export const DownloadAction = (router: NextRouter, streamURL: string): Action => ({
	icon: <Download/>,
	label: "Download",
	onClick: () => downloadAction(router, API.getStreamURL(streamURL))
});

export const DownloadAsyncAction = (router: NextRouter, streamURL: () => PromiseLike<string>): Action => ({
	icon: <Download/>,
	label: "Download",
	onClick: () => streamURL().then((url) => downloadAction(router, API.getStreamURL(url)))
})

export const ShareArtistAction = (artistIdentifier: string | number): Action => ShareAction(`/artists/${artistIdentifier}`);

export const ShareAlbumAction = (albumIdentifier: string | number): Action => ShareAction(`/albums/${albumIdentifier}`);

export const ShareReleaseAction = (releaseIdentifier: string | number): Action => ShareAction(`/releases/${releaseIdentifier}`);

export const ShareSongAction = (songSlug: string | number): Action => ShareAction(`/songs/${songSlug}/versions`);


export default Action;