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

import { ShareIcon } from "@/ui/icons";
import copyLinkToClipboard from "~/utils/copy-link";
import type Action from "./";

export const ShareAction = (url: string, t: Translator): Action => ({
	onClick: () => copyLinkToClipboard(url, t),
	label: "actions.share",
	icon: <ShareIcon />,
});

export const ShareArtistAction = (
	artistIdentifier: string | number,
	t: Translator,
): Action => ShareAction(`/artists/${artistIdentifier}`, t);

export const ShareAlbumAction = (
	albumIdentifier: string | number,
	t: Translator,
): Action => ShareAction(`/albums/${albumIdentifier}`, t);

export const ShareReleaseAction = (
	releaseIdentifier: string | number,
	t: Translator,
): Action => ShareAction(`/releases/${releaseIdentifier}`, t);

export const ShareSongAction = (
	songSlug: string | number,
	t: Translator,
): Action => ShareAction(`/songs/${songSlug}`, t);

export const SharePlaylistAction = (
	playlistSlug: string | number,
	t: Translator,
): Action => ShareAction(`/playlists/${playlistSlug}`, t);
