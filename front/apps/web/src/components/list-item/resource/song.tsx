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

import { useEffect, useState } from "react";
import type Artist from "@/models/artist";
import type { SongWithRelations } from "@/models/song";
import type { SongGroupWithRelations } from "@/models/song-group";
import { SongIcon } from "@/ui/icons";
import formatArtists from "@/utils/format-artists";
import SongContextualMenu from "~/components/contextual-menu/resource/song";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";

type SongItemProps<
	T extends SongWithRelations<
		"artist" | "featuring" | "master" | "illustration"
	>,
> = {
	song: T | undefined;
	onClick?: () => void;
	mainArtist?: Artist | null;
	subtitles?: ((
		song: SongWithRelations<
			"artist" | "featuring" | "master" | "illustration"
		>,
	) => Promise<string | null>)[];
};

export const SongGroupItem = <
	T extends SongGroupWithRelations<
		"artist" | "featuring" | "master" | "illustration"
	>,
>({
	song,
	subtitles,
	mainArtist,
	onClick,
}: SongItemProps<T>) => {
	return (
		<SongItem
			song={
				song
					? { ...song, id: song.songId, groupId: song.id }
					: undefined
			}
			onClick={onClick}
			subtitles={[
				...(subtitles
					? subtitles
					: [
							async (
								s: SongWithRelations<"artist" | "featuring">,
							) => defaultSubtitle(s, mainArtist),
						]),
				...(song && (song.versionCount ?? 0) > 1
					? [async () => `${song.versionCount} Versions`]
					: []),
			]}
		/>
	);
};

const defaultSubtitle = (
	s: SongWithRelations<"artist" | "featuring">,
	mainArtist: Artist | undefined | null,
) => formatArtists(s.artist, s.featuring, mainArtist);

/**
 * Item for a list of songs
 * @param props
 * @returns
 */
const SongItem = <
	T extends SongWithRelations<
		"artist" | "featuring" | "master" | "illustration"
	>,
>({
	song,
	subtitles,
	onClick,
	mainArtist,
}: SongItemProps<T>) => {
	const artist = song?.artist;
	const [subtitle, setSubtitle] = useState<string | null | undefined>(
		subtitles?.length
			? ((<br />) as unknown as string)
			: song
				? defaultSubtitle(song, mainArtist)
				: undefined,
	);

	useEffect(() => {
		if (subtitles && song) {
			Promise.allSettled(subtitles.map((s) => s(song))).then((r) =>
				setSubtitle(
					r
						.map(
							(s) =>
								(s as PromiseFulfilledResult<string | null>)
									.value,
						)
						.filter((s): s is string => s !== null)
						.join(" • ") || null,
				),
			);
		}
	}, [subtitles, song]);
	return (
		<ListItem
			icon={
				<Illustration
					illustration={song?.illustration}
					fallback={<SongIcon />}
					quality="low"
				/>
			}
			title={song?.name}
			onClick={song && artist && (() => onClick?.())}
			secondTitle={subtitle}
			trailing={song && <SongContextualMenu song={song} />}
		/>
	);
};

export default SongItem;
