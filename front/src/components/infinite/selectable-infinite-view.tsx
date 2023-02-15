import {
	Box, Chip, Grid
} from "@mui/material";
import { capitalCase } from "change-case";
import { useState } from "react";
import {
	AlbumSortingKeys, AlbumType, AlbumWithRelations
} from "../../models/album";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import InfiniteAlbumView from "./infinite-resource-view/infinite-album-view";
import InfiniteArtistView from "./infinite-resource-view/infinite-artist-view";
import InfiniteSongView from "./infinite-resource-view/infinite-song-view";
import { SongSortingKeys, SongWithRelations } from "../../models/song";
import { SortingParameters } from "../../utils/sorting";

const itemTypes = [
	'artist',
	'album',
	'song'
];

type SelectableInfiniteViewProps = {
	albumQuery: MeeloInfiniteQueryFn<AlbumWithRelations<'artist'>, [sort: SortingParameters<typeof AlbumSortingKeys>, type: AlbumType | undefined]>;
	artistQuery: MeeloInfiniteQueryFn<Artist, [sort: SortingParameters<typeof ArtistSortingKeys>]>;
	songQuery: MeeloInfiniteQueryFn<SongWithRelations<'artist'>, [sort: SortingParameters<typeof SongSortingKeys>]>;
	default?: string | typeof itemTypes[number];
	onTypeSelect?: (selectedType: SelectableInfiniteViewProps['default']) => void;
	enabled: boolean;
}

const SelectableInfiniteView = (props: SelectableInfiniteViewProps) => {
	const [selectedType, selectItemType] = useState<typeof itemTypes[number]>(props.default && itemTypes.includes(props.default) ? props.default : 'album');

	return <Box sx={{ width: '100%', display: 'flex', justifyContent: "center", flexDirection: 'column' }}>
		<Grid container spacing={2} sx={{ justifyContent: 'center', marginBottom: 2 }}>
			{ itemTypes.map((item) =>
				<Grid item key={item}>
					<Chip label={capitalCase(item + 's')} variant={selectedType == item ? 'filled' : 'outlined'} onClick={() => {
						selectItemType(item);
						props.onTypeSelect && props.onTypeSelect(item);
					}}/>
				</Grid>)}
		</Grid>
		{ props.enabled && (selectedType == 'artist' ?
			<InfiniteArtistView
				query={(sort) => props.artistQuery(sort)}
			/>
			: selectedType == 'album' ?
				<InfiniteAlbumView key={selectedType}
					defaultLayout='list'
					query={(sort, type) => props.albumQuery(sort, type)}
				/>
				: selectedType == 'song' ?
					<InfiniteSongView key={selectedType}
						query={(sort) => props.songQuery(sort)}
					/> : <></>
		)}
	</Box>;
};

export default SelectableInfiniteView;
