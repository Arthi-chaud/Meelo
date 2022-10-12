import { Search } from "@mui/icons-material";
import { Box, Chip, Grid, InputAdornment, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { InfiniteFetchFn } from "../../components/infinite/infinite-scroll";
import InfiniteView from "../../components/infinite/infinite-view";
import Resource from "../../models/resource";
import API from '../../api';
import { Page } from '../../components/infinite/infinite-scroll';
import Album, { AlbumSortingKeys, AlbumWithArtist } from '../../models/album';
import Artist, { ArtistSortingKeys } from '../../models/artist';
import Song, { SongSortingKeys, SongWithArtist } from '../../models/song';
import ArtistTile from '../../components/tile/artist-tile';
import ArtistItem from "../../components/list-item/artist-item";
import InfiniteAlbumView from '../../components/infinite/infinite-album-view';
import SongItem from "../../components/list-item/song-item";
import { SortingParameters } from "../../utils/sorting";
import InfiniteArtistView from "../../components/infinite/infinite-artist-view";
import InfiniteSongView from "../../components/infinite/infinite-song-view";

const searchArtistsQuery = (query: string, sort?: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: ["search", "artists", query, sort ?? {}],
	exec: (lastPage: Page<Artist>) => API.searchArtists(query, lastPage, sort)
});

const searchAlbumsQuery = (query: string, sort?: SortingParameters<typeof AlbumSortingKeys>) => ({
	key: ["search", "albums", query, sort ?? {}],
	exec: (lastPage: Page<AlbumWithArtist>) => API.searchAlbums<AlbumWithArtist>(query, lastPage, sort, ['artist'])
});

const searchSongsQuery = (query: string, sort?: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["search", "songs", query, sort ?? {}],
	exec: (lastPage: Page<Song>) => API.searchSongs<SongWithArtist>(query, lastPage, sort, ['artist'])
});

const itemTypes = ['Artists', 'Albums', 'Songs'] as const;

const SearchPage = () => {
	const [query, setQuery] = useState<string>();
	const [buffer, setBuffer] = useState<string>();
	useEffect(() => {
		const timer = setTimeout(() => {
			if (buffer)
				setQuery(buffer);
		}, 500)
	  	return () => clearTimeout(timer)
	}, [buffer])
	const [selectedType, selectItemType] = useState<typeof itemTypes[number]>('Albums');
	return <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3, flexDirection: 'column' }}>
		<Grid container spacing={2} sx={{ flexDirection: 'column', alignItems: 'center' }}>
			<Grid item>
				<TextField id="outlined-basic" label="Search" variant="outlined" autoFocus InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<Search />
						</InputAdornment>
					),
				}} onChange={(e) => setBuffer(e.target.value)}/>
			</Grid>
			<Grid item container spacing={2} sx={{ justifyContent: 'center' }}>
			{ itemTypes.map((item) => (
				<Grid item key={item}>
					<Chip label={item} variant={ selectedType == item ? 'filled' : 'outlined'} onClick={() => {
						selectItemType(item);
					}}/>
				</Grid>
			))}
			</Grid>
		</Grid>
		{ query && (selectedType == 'Artists'
			? <InfiniteArtistView
				initialSortingField={'name'}
				initialSortingOrder={'asc'}
				initialView={'list'}
				query={(sort) => searchArtistsQuery(query, sort)}
			/>
			: selectedType == 'Albums'
				? <InfiniteAlbumView key={selectedType}
					initialSortingField={'name'}
					initialSortingOrder={'asc'}
					initialView={'list'}
					query={(sort) => searchAlbumsQuery(query, sort)}
				/>
				: selectedType == 'Songs'
					? <InfiniteSongView key={selectedType}
						initialSortingField={'name'}
						initialSortingOrder={'asc'}
						query={(sort) => searchSongsQuery(query, sort)}
					/> : <></>
		)}
	</Box>
}
export default SearchPage;