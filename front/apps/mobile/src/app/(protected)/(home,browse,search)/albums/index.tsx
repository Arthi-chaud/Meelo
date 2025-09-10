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

import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { getAlbums, getArtist } from "@/api/queries";
import { AlbumSortingKeys, AlbumType } from "@/models/album";
import { albumTypeToTranslationKey } from "@/models/utils";
import { useInfiniteQuery, useQuery } from "~/api";
import { Coverflow, Deceleration, Sentivity } from "~/components/coverflow";
import { Illustration } from "~/components/illustration";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { AlbumItem, AlbumTile } from "~/components/item/resource/album";
import { ArtistHeader } from "~/components/resource-header";

export default function AlbumBrowseView() {
	const { t } = useTranslation();
	const { compilations, artist: artistId } = useLocalSearchParams<{
		compilations?: "true";
		artist?: string;
	}>();
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
	const { data: artist } = useQuery(
		(artistId) => getArtist(artistId, ["illustration"]),
		artistId,
	);
	const Item = layout === "list" ? AlbumItem : AlbumTile;
	const { items } = useInfiniteQuery(() =>
		getAlbums({}, undefined, ["artist", "illustration"]),
	);
	return (
		<Coverflow
			{...{
				initialSelection: 0,
				onChange: () => {},
				onPress: () => {},
				sensitivity: Sentivity.Normal,
				style: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				},
				deceleration: Deceleration.Normal,
				spacing: 200,
				wingSpan: 80,
				rotation: 50,
				midRotation: 50,
				perspective: 800,
				scaleDown: 0.8,
				scaleFurther: 0.75,
			}}
		>
			{items?.map((item, idx) => (
				<View
					key={idx}
					style={{
						width: 90 * 2.5,
						height: 90 * 2.5,
						alignItems: "center",
						backgroundColor: "blue",
						borderWidth: 2,
						borderRadius: 10,
					}}
				>
					<Illustration
						illustration={item.illustration}
						quality="medium"
					/>
				</View>
			)) ?? []}
		</Coverflow>
	);
}
