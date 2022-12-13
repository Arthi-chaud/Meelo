import {
	Box, Chip, Grid
} from "@mui/material";
import { capitalCase } from "change-case";
import { useState } from "react";
import Album from "../../models/album";
import Artist from "../../models/artist";
import { SongWithArtist } from "../../models/song";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import InfiniteAlbumView from "./infinite-resource-view/infinite-album-view";
import InfiniteArtistView from "./infinite-artist-view";
import InfiniteSongView from "./infinite-song-view";

const itemTypes = [
	'artist',
	'album',
	'song'
];

type SelectableInfiniteViewProps = {
	albumQuery: MeeloInfiniteQueryFn<Album>;
	artistQuery: MeeloInfiniteQueryFn<Artist>;
	songQuery: MeeloInfiniteQueryFn<SongWithArtist>;
	default?: string | typeof itemTypes[number];
	onTypeSelect?: (selectedType: SelectableInfiniteViewProps['default']) => void;
	enabled: boolean;
}

const SelectableInfiniteView = (props: SelectableInfiniteViewProps) => {
	const [selectedType, selectItemType] = useState<typeof itemTypes[number]>(props.default && itemTypes.includes(props.default) ? props.default : 'album');

	return <Box sx={{ width: '100%', display: 'flex', justifyContent: "center", flexDirection: 'column' }}>
		<Grid container spacing={2} sx={{ justifyContent: 'center' }}>
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
