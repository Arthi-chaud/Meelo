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

import { getAlbums } from "@/api/queries";
import { AlbumSortingKeys, AlbumType } from "@/models/album";
import { albumTypeToTranslationKey } from "@/models/utils";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { AlbumItem } from "~/components/list-item/resource/album";
import { AlbumTile } from "~/components/tile/resource/album";

export default function AlbumBrowseView() {
	const { t } = useTranslation();
	const { compilations } = useLocalSearchParams<{ compilations?: "true" }>();
	const [{ layout }, layoutControl] = useLayoutControl({
		defaultLayout: "grid",
		enableToggle: true,
	});
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: AlbumSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [libraries, libraryFilterControl] = useLibraryFiltersControl();
	const [types, albumTypeFilterControl] = useTypeFiltersControl({
		types: AlbumType,
		translate: (t) => albumTypeToTranslationKey(t, false),
	});
	const Item = layout === "list" ? AlbumItem : AlbumTile;
	return (
		<>
			<Stack.Screen
				options={{
					headerTitle: t(
						compilations
							? "nav.compilations"
							: "models.album_plural",
					),
				}}
			/>
			<InfiniteView
				layout={layout}
				controls={{
					layout: layoutControl,
					sort: sortControl,
					filters: [libraryFilterControl, albumTypeFilterControl],
				}}
				query={getAlbums(
					{
						library: libraries,
						type: types,
						artist: compilations ? "compilations" : undefined,
					},
					{ sortBy: sort ?? "name", order: order ?? "asc" },
					["artist", "illustration"],
				)}
				render={(album) => (
					<Item
						album={album}
						illustrationProps={{ simpleColorPlaceholder: true }}
					/>
				)}
			/>
		</>
	);
}
