import { Search } from "@mui/icons-material";
import { Box, Chip, Grid, InputAdornment, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { InfiniteFetchFn } from "../../components/infinite/infinite-scroll";
import InfiniteView from "../../components/infinite/infinite-view";
import Resource from "../../models/resource";
import API from '../../api';
import { Page } from '../../components/infinite/infinite-scroll';
import Album, { AlbumSortingKeys, AlbumType, AlbumWithArtist } from '../../models/album';
import Artist, { ArtistSortingKeys } from '../../models/artist';
import Song, { SongSortingKeys, SongWithArtist } from '../../models/song';
import ArtistTile from '../../components/tile/artist-tile';
import ArtistItem from "../../components/list-item/artist-item";
import InfiniteAlbumView from '../../components/infinite/infinite-album-view';
import SongItem from "../../components/list-item/song-item";
import { SortingParameters } from "../../utils/sorting";
import InfiniteArtistView from "../../components/infinite/infinite-artist-view";
import InfiniteSongView from "../../components/infinite/infinite-song-view";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";

const searchArtistsQuery = (query: string, sort?: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: ["search", "artists", query, sort ?? {}],
	exec: (lastPage: Page<Artist>) => API.searchArtists(query, lastPage, sort)
});

const searchAlbumsQuery = (query: string, sort?: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) => ({
	key: ["search", "albums", query, sort ?? {}, type ?? {}],
	exec: (lastPage: Page<AlbumWithArtist>) => API.searchAlbums<AlbumWithArtist>(query, lastPage, type, sort, ['artist'])
});

const searchSongsQuery = (query: string, sort?: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["search", "songs", query, sort ?? {}],
	exec: (lastPage: Page<Song>) => API.searchSongs<SongWithArtist>(query, lastPage, sort, ['artist'])
});

const SearchPage = () => {
	const [query, setQuery] = useState<string>();
	const [buffer, setBuffer] = useState<string>();
	useEffect(() => {
		const timer = setTimeout(() => {
			if (buffer)
				setQuery(buffer);
		}, 500)
	  	return () => clearTimeout(timer)
	}, [buffer]);
	return <Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 3, flexDirection: 'column' }}>
		<Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 2 }}>
			<TextField id="outlined-basic" label="Search" variant="outlined" autoFocus InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<Search />
					</InputAdornment>
				),
			}} onChange={(e) => setBuffer(e.target.value)}/>
		</Box>
		<SelectableInfiniteView
			enabled={query !== undefined}
			artistQuery={(sort) => searchArtistsQuery(query!, sort)}
			albumQuery={(sort, type) => searchAlbumsQuery(query!, sort, type)}
			songQuery={(sort) => searchSongsQuery(query!, sort)}
		/>
	</Box>
}
export default SearchPage;