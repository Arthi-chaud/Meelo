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

import { Box, Chip, Grid } from "@mui/material";
import { useState } from "react";
import {
	AlbumSortingKeys,
	AlbumType,
	AlbumWithRelations,
} from "../../models/album";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import InfiniteAlbumView from "./infinite-resource-view/infinite-album-view";
import InfiniteArtistView from "./infinite-resource-view/infinite-artist-view";
import InfiniteSongView from "./infinite-resource-view/infinite-song-view";
import {
	SongSortingKeys,
	SongType,
	SongWithRelations,
} from "../../models/song";
import { SortingParameters } from "../../utils/sorting";
import Translate from "../../i18n/translate";

const itemTypes = ["artist", "album", "song"] as const;

type SelectableInfiniteViewProps = {
	albumQuery: MeeloInfiniteQueryFn<
		AlbumWithRelations<"artist">,
		[
			param: {
				type: AlbumType | undefined;
				library: string | number | null;
			},
			sort: SortingParameters<typeof AlbumSortingKeys>,
		]
	>;
	// eslint-disable-next-line max-len
	artistQuery: MeeloInfiniteQueryFn<
		Artist,
		[
			param: { library: string | number | null },
			sort: SortingParameters<typeof ArtistSortingKeys>,
		]
	>;
	songQuery: MeeloInfiniteQueryFn<
		SongWithRelations<"artist" | "featuring">,
		[
			param: {
				type: SongType | undefined;
				random?: number;
				library: string | number | null;
			},
			sort: SortingParameters<typeof SongSortingKeys>,
		]
	>;
	default?: string | (typeof itemTypes)[number];
	onTypeSelect?: (
		selectedType: SelectableInfiniteViewProps["default"],
	) => void;
	enabled: boolean;
};

const SelectableInfiniteView = (props: SelectableInfiniteViewProps) => {
	const [selectedType, selectItemType] = useState<(typeof itemTypes)[number]>(
		props.default &&
			itemTypes.includes(props.default as (typeof itemTypes)[number])
			? (props.default as (typeof itemTypes)[number])
			: "album",
	);

	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				justifyContent: "center",
				flexDirection: "column",
			}}
		>
			<Grid
				container
				spacing={2}
				sx={{ justifyContent: "center", marginBottom: 2 }}
			>
				{itemTypes.map((item) => (
					<Grid item key={item}>
						<Chip
							label={<Translate translationKey={item} />}
							variant={
								selectedType == item ? "filled" : "outlined"
							}
							onClick={() => {
								selectItemType(item);
								props.onTypeSelect && props.onTypeSelect(item);
							}}
						/>
					</Grid>
				))}
			</Grid>
			{props.enabled &&
				(selectedType == "artist" ? (
					<InfiniteArtistView
						query={({ library, sortBy, order }) =>
							props.artistQuery({ library }, { sortBy, order })
						}
					/>
				) : selectedType == "album" ? (
					<InfiniteAlbumView
						key={selectedType}
						defaultAlbumType={null}
						defaultLayout="list"
						query={({ sortBy, order, type, library }) =>
							props.albumQuery(
								{ library: library ?? null, type },
								{ sortBy, order },
							)
						}
					/>
				) : selectedType == "song" ? (
					<InfiniteSongView
						disableShuffle
						key={selectedType}
						query={({ sortBy, order, type, library }) =>
							props.songQuery(
								{ library: library ?? null, type },
								{ sortBy, order },
							)
						}
					/>
				) : (
					<></>
				))}
		</Box>
	);
};

export default SelectableInfiniteView;
