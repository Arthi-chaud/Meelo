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

import {
	AlbumIcon,
	ArtistIcon,
	LyricsIcon,
	RelatedTracksIcon,
	SearchIcon,
	SettingsIcon,
	SongIcon,
} from "../icons";
import type { NextRouter } from "next/router";
import type Action from "./action";
import toast from "react-hot-toast";

export const GoToSongLyricsAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/lyrics`,
	label: "seeLyrics",
	icon: <LyricsIcon />,
});

export const GoToArtistAction = (
	artistIdentifier: string | number,
): Action => ({
	href: `/artists/${artistIdentifier}`,
	label: "goToArtist",
	icon: <ArtistIcon />,
});

export const GoToArtistAlbumsAction = (
	artistIdentifier: string | number,
): Action => ({
	href: `/artists/${artistIdentifier}/albums`,
	label: "seeAlbums",
	icon: <AlbumIcon />,
});

export const GoToArtistSongsAction = (
	artistIdentifier: string | number,
): Action => ({
	href: `/artists/${artistIdentifier}/songs`,
	label: "seeSongs",
	icon: <SongIcon />,
});

export const GoToAlbumAction = (albumIdentifier: string | number): Action => ({
	href: `/albums/${albumIdentifier}`,
	label: "goToAlbum",
	icon: <AlbumIcon />,
});

export const GoToReleaseAction = (
	releaseIdentifier: string | number,
): Action => ({
	href: `/releases/${releaseIdentifier}`,
	label: "goToAlbum",
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
	label: "goToAlbum",
	icon: <AlbumIcon />,
});

export const GoToSongVersionAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/versions`,
	label: "seeOtherVersions",
	icon: <AlbumIcon />,
});

export const GoToRelatedTracksAction = (
	songIdentifier: string | number,
): Action => ({
	href: `/songs/${songIdentifier}/tracks`,
	label: "seeRelatedTracks",
	icon: <RelatedTracksIcon />,
});

export const GoToSearchAction = {
	label: "search",
	icon: <SearchIcon />,
	href: "/search",
} as const;

export const GoToSettingsAction: Action = {
	label: "settings",
	icon: <SettingsIcon />,
	href: "/settings",
};
