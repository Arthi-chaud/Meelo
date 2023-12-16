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
