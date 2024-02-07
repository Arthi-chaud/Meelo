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

import API from "../../api/api";
import { SongWithRelations } from "../../models/song";
import Illustration from "../illustration";
import ListItem from "./item";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import { useQueryClient } from "../../api/use-query";
import { useEffect, useState } from "react";
import { SongIcon } from "../icons";
import formatArtists from "../../utils/formatArtists";
import { usePlayerContext } from "../../contexts/player";

type SongItemProps<T extends SongWithRelations<"artist" | "featuring">> = {
	song: T | undefined;
	formatSubtitle?: (song: T) => Promise<string>;
};

/**
 * Item for a list of songs
 * @param props
 * @returns
 */
const SongItem = <T extends SongWithRelations<"artist" | "featuring">>({
	song,
	formatSubtitle,
}: SongItemProps<T>) => {
	const artist = song?.artist;
	const { playTrack } = usePlayerContext();
	const queryClient = useQueryClient();
	const [subtitle, setSubtitle] = useState(
		formatSubtitle
			? ((<br />) as unknown as string)
			: song
				? formatArtists(song.artist, song.featuring)
				: undefined,
	);

	useEffect(() => {
		if (formatSubtitle && song) {
			formatSubtitle(song).then((newSub) => setSubtitle(newSub));
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
				(() =>
					queryClient
						.fetchQuery(API.getMasterTrack(song.id, ["release"]))
						.then((track) => {
							playTrack({
								artist,
								track,
								release: track.release,
							});
						}))
			}
			secondTitle={subtitle}
			trailing={song && <SongContextualMenu song={song} />}
		/>
	);
};

export default SongItem;
