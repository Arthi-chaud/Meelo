import { useCallback } from "react";
import { Share } from "react-native";
import { ShareIcon } from "@/ui/icons";
import type { Action } from "~/actions";
import { useAPI } from "~/api";

export const useShareCallback = () => {
	const api = useAPI();

	return useCallback(
		(route: string) =>
			Share.share({ url: `${api.urls.api.replace("/api", "")}${route}` }),
		[api],
	);
};

export const ShareAction = (callback: () => void): Action => ({
	label: "actions.share",
	icon: ShareIcon,
	onPress: callback,
});

export const useShareAlbumAction = (albumId: string | number | undefined) => {
	const c = useShareCallback();
	if (!albumId) {
		return undefined;
	}
	return ShareAction(() => c(`/albums/${albumId}`));
};

export const useSharePlaylistAction = (
	playlistId: string | number | undefined,
) => {
	const c = useShareCallback();
	if (!playlistId) {
		return undefined;
	}
	return ShareAction(() => c(`/playlists/${playlistId}`));
};

export const useShareArtistAction = (artistId: string | number | undefined) => {
	const c = useShareCallback();
	if (!artistId) {
		return undefined;
	}
	return ShareAction(() => c(`/artists/${artistId}`));
};

export const useShareSongAction = (songId: string | number | undefined) => {
	const c = useShareCallback();
	if (!songId) {
		return undefined;
	}
	return ShareAction(() => c(`/songs/${songId}`));
};
