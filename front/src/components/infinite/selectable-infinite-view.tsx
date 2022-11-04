import { Box, Chip, Divider, Grid } from "@mui/material";
import { useState } from "react";
import Album from "../../models/album"
import Artist from "../../models/artist";
import Song, { SongWithArtist } from "../../models/song";
import { MeeloInfiniteQueryFn } from "../../query"
import InfiniteAlbumView from "./infinite-album-view";
import InfiniteArtistView from "./infinite-artist-view";
import InfiniteSongView from "./infinite-song-view";

const itemTypes = ['Artists', 'Albums', 'Songs'] as const;

type SelectableInfiniteViewProps = {
	albumQuery: MeeloInfiniteQueryFn<Album>;
	artistQuery: MeeloInfiniteQueryFn<Artist>;
	songQuery: MeeloInfiniteQueryFn<SongWithArtist>;
	default?: typeof itemTypes[number];
	enabled: boolean;
}

const SelectableInfiniteView = (props: SelectableInfiniteViewProps) => {
	const [selectedType, selectItemType] = useState<typeof itemTypes[number]>(props.default ?? 'Albums');
	return <Box sx={{ width: '100%', display: 'flex', justifyContent: "center", flexDirection: 'column' }}>
		<Grid container spacing={2} sx={{ justifyContent: 'center' }}>
			{ itemTypes.map((item) => (
				<Grid item key={item}>
					<Chip label={item} variant={ selectedType == item ? 'filled' : 'outlined'} onClick={() => {
						selectItemType(item);
					}}/>
				</Grid>
			))}
		</Grid>
		{ props.enabled && (selectedType == 'Artists'
			? <InfiniteArtistView
				initialSortingField={'name'}
				initialSortingOrder={'asc'}
				initialView={'list'}
				query={(sort) => props.artistQuery(sort)}
			/>
			: selectedType == 'Albums'
				? <InfiniteAlbumView key={selectedType}
					initialSortingField={'name'}
					initialSortingOrder={'asc'}
					initialView={'list'}
					query={(sort, type) => props.albumQuery(sort, type)}
				/>
				: selectedType == 'Songs'
					? <InfiniteSongView key={selectedType}
						initialSortingField={'name'}
						initialSortingOrder={'asc'}
						query={(sort) => props.songQuery(sort)}
					/> : <></>
		)}
	</Box>
}

export default SelectableInfiniteView;