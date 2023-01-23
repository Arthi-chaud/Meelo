import { Share } from "@mui/icons-material";
import copyLinkToClipboard from "../../utils/copy-link";
import Action from "./action";

export const ShareAction = (url: string): Action => ({
	onClick: () => copyLinkToClipboard(url),
	label: 'Share',
	icon: <Share/>
});

export const ShareArtistAction = (artistIdentifier: string | number): Action => ShareAction(`/artists/${artistIdentifier}`);

export const ShareAlbumAction = (albumIdentifier: string | number): Action => ShareAction(`/albums/${albumIdentifier}`);

export const ShareReleaseAction = (releaseIdentifier: string | number): Action => ShareAction(`/releases/${releaseIdentifier}`);

export const ShareSongAction = (songSlug: string | number): Action => ShareAction(`/songs/${songSlug}`);
