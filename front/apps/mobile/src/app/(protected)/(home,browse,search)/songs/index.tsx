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

import { getArtist, getSongs } from "@/api/queries";
import {
	SongSortingKeys,
	SongType,
	type SongWithRelations,
} from "@/models/song";
import { songTypeToTranslationKey } from "@/models/utils";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "~/api";
import { ArtistHeader } from "~/components/artist-header";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { SongItem } from "~/components/item/resource/song";

// TODO Handle Genre Query param
// TODO Handle song version filtering
// TODO song subtitle: allow it to be album

export default function SongBrowseView() {
	const nav = useNavigation();
	const { t } = useTranslation();
	const { artist: artistId, rare: rareArtistId } = useLocalSearchParams<{
		artist?: string;
		rare?: string;
	}>();
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: SongSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [types, songTypeFilterControl] = useTypeFiltersControl({
		types: SongType,
		translate: (t) => songTypeToTranslationKey(t, false),
	});
	const { data: artist } = useQuery(
		(artistId) => getArtist(artistId, ["illustration"]),
		artistId ?? rareArtistId,
	);
	useEffect(() => {
		if (rareArtistId !== undefined) {
			nav.setOptions({ headerTitle: t("artist.rareSongs") });
		}
	}, [rareArtistId]);
	const subtitle = useCallback(
		(song: SongWithRelations<"featuring"> | undefined) => {
			if (artistId === undefined && rareArtistId === undefined) {
				return "artists";
			}
			if (!song || !artist) {
				return null;
			}
			if (song.featuring.length > 0 || song.artistId !== artist.id) {
				return "artists";
			}
			return null;
		},
		[artistId, rareArtistId],
	);
	return (
		<InfiniteView
			layout={"list"}
			header={
				(artistId ?? rareArtistId) !== undefined ? (
					<ArtistHeader artist={artist} />
				) : undefined
			}
			controls={{
				sort: sortControl,
				filters: [libraryFilterControl, songTypeFilterControl],
			}}
			query={getSongs(
				{
					library: libraries,
					type: types,
					artist: artistId,
					rare: rareArtistId,
				},
				{ sortBy: sort ?? "name", order: order ?? "asc" },
				["artist", "illustration", "featuring"],
			)}
			render={(song) => (
				<SongItem
					song={song}
					subtitle={subtitle(song)}
					illustrationProps={{ simpleColorPlaceholder: true }}
				/>
			)}
		/>
	);
}
