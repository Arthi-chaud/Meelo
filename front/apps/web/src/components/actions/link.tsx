/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { NextRouter } from "next/router";
import toast from "react-hot-toast";
import {
	AlbumIcon,
	ArtistIcon,
	InfoIcon,
	LyricsIcon,
	RelatedTracksIcon,
	SearchIcon,
	SettingsIcon,
	SongIcon,
} from "@/ui/icons";
import type Action from "./";

export const GoToSongLyricsAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/lyrics`,
	label: "actions.song.seeLyrics",
	icon: <LyricsIcon />,
});

export const GoToSongInfoAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/info`,
	label: "actions.song.seeSongInfo",
	icon: <InfoIcon />,
});

export const GoToArtistAction = (
	artistIdentifier: string | number,
): Action => ({
	href: `/artists/${artistIdentifier}`,
	label: "actions.goToArtist",
	icon: <ArtistIcon />,
});

export const GoToArtistAlbumsAction = (
	artistIdentifier: string | number,
): Action => ({
	href: `/artists/${artistIdentifier}/albums`,
	label: "actions.artist.seeAlbums",
	icon: <AlbumIcon />,
});

export const GoToArtistSongsAction = (
	artistIdentifier: string | number,
): Action => ({
	href: `/artists/${artistIdentifier}/songs`,
	label: "actions.artist.seeSongs",
	icon: <SongIcon />,
});

export const GoToAlbumAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}`,
	label: "actions.album.goToAlbum",
	icon: <AlbumIcon />,
});

export const GoToReleaseAction = (
	releaseIdentifier: string | number,
): Action => ({
	href: `/releases/${releaseIdentifier}`,
	label: "actions.album.goToAlbum",
	icon: <AlbumIcon />,
});

export const GoToReleaseAsyncAction = (
	router: NextRouter,
	albumIdentifier: () => PromiseLike<number | string | null>,
): Action => ({
	onClick: () =>
		albumIdentifier().then((id) => {
			if (id === null) {
				toast.error("This resource is not attached to any album.");
			} else {
				router.push(`/releases/${id}`);
			}
		}),
	label: "actions.album.goToAlbum",
	icon: <AlbumIcon />,
});

export const GoToSongVersionAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/versions`,
	label: "actions.song.seeOtherVersions",
	icon: <AlbumIcon />,
});

export const GoToRelatedTracksAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/tracks`,
	label: "actions.song.seeRelatedTracks",
	icon: <RelatedTracksIcon />,
});

export const GoToSearchAction = {
	label: "nav.search",
	icon: <SearchIcon />,
	href: "/search",
} as const;

export const GoToSettingsAction: Action = {
	label: "actions.goToSettingsPage",
	icon: <SettingsIcon />,
	href: "/settings",
};
