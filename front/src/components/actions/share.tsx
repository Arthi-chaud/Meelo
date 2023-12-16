import copyLinkToClipboard from "../../utils/copy-link";
import { ShareIcon } from "../icons";
import Action from "./action";

export const ShareAction = (url: string): Action => ({
	onClick: () => copyLinkToClipboard(url),
	label: "share",
	icon: <ShareIcon />,
});

export const ShareArtistAction = (artistIdentifier: string | number): Action =>
	ShareAction(`/artists/${artistIdentifier}`);

export const ShareAlbumAction = (albumIdentifier: string | number): Action =>
	ShareAction(`/albums/${albumIdentifier}`);

export const ShareReleaseAction = (
	releaseIdentifier: string | number,
): Action => ShareAction(`/releases/${releaseIdentifier}`);

export const ShareSongAction = (songSlug: string | number): Action =>
	ShareAction(`/songs/${songSlug}`);

export const SharePlaylistAction = (playlistSlug: string | number): Action =>
	ShareAction(`/playlists/${playlistSlug}`);
