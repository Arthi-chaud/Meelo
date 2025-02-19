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

import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import type { SongWithRelations } from "../../models/song";
import type { SongGroupWithRelations } from "../../models/song-group";
import { playTrackAtom } from "../../state/player";
import formatArtists from "../../utils/formatArtists";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import { SongIcon } from "../icons";
import Illustration from "../illustration";
import ListItem from "./item";

type SongItemProps<
	T extends SongWithRelations<
		"artist" | "featuring" | "master" | "illustration"
	>,
> = {
	song: T | undefined;
	onClick?: () => void;
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
}: SongItemProps<T>) => {
	return (
		<SongItem
			song={
				song
					? { ...song, id: song.songId, groupId: song.id }
					: undefined
			}
			subtitles={[
				...(subtitles
					? subtitles
					: [
							async (
								s: SongWithRelations<"artist" | "featuring">,
							) => defaultSubtitle(s),
						]),
				...(song && (song.versionCount ?? 0) > 1
					? [async () => `${song.versionCount} Versions`]
					: []),
			]}
		/>
	);
};

const defaultSubtitle = (s: SongWithRelations<"artist" | "featuring">) =>
	formatArtists(s.artist, s.featuring);

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
}: SongItemProps<T>) => {
	const artist = song?.artist;
	const playTrack = useSetAtom(playTrackAtom);
	const [subtitle, setSubtitle] = useState<string | null | undefined>(
		subtitles?.length
			? ((<br />) as unknown as string)
			: song
				? defaultSubtitle(song)
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
	}, []);
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
			onClick={
				song &&
				artist &&
				(() => {
					onClick?.();
					playTrack({
						artist,
						track: {
							...song.master,
							illustration: song.illustration,
						},
					});
				})
			}
			secondTitle={subtitle}
			trailing={song && <SongContextualMenu song={song} />}
		/>
	);
};

export default SongItem;
