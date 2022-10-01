import { Search } from "@mui/icons-material";
import { Box, Chip, Grid, InputAdornment, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { InfiniteFetchFn } from "../../components/infinite/infinite-scroll";
import InfiniteView from "../../components/infinite/infinite-view";
import Resource from "../../models/resource";
import API from '../../api';
import { Page } from '../../components/infinite/infinite-scroll';
import Album, { AlbumWithArtist } from '../../models/album';
import Artist from '../../models/artist';
import Song, { SongWithArtist } from '../../models/song';
import ArtistTile from '../../components/tile/artist-tile';
import ArtistItem from "../../components/list-item/artist-item";
import AlbumTile from '../../components/tile/album-tile';
import AlbumItem from "../../components/list-item/album-item";
import SongItem from "../../components/list-item/song-item";

const searchArtistsQuery = (query: string) => ({
	key: ["search", "artists", query],
	exec: (lastPage: Page<Artist>) => API.searchArtists(query, lastPage)
});

const searchAlbumsQuery = (query: string) => ({
	key: ["search", "albums", query],
	exec: (lastPage: Page<AlbumWithArtist>) => API.searchAlbums<AlbumWithArtist>(query, lastPage, ['artist'])
});

const searchSongsQuery = (query: string) => ({
	key: ["search", "songs", query],
	exec: (lastPage: Page<Song>) => API.searchSongs<SongWithArtist>(query, lastPage, ['artist'])
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
				<TextField id="outlined-basic" label="Search" variant="outlined" InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<Search />
						</InputAdornment>
					),
				}} onChange={(e) => setBuffer(e.target.value)}/>
			</Grid>
			<Grid item container spacing={2} sx={{ justifyContent: 'center' }}>
			{ itemTypes.map((item) => (
				<Grid item>
					<Chip label={item} variant={ selectedType == item ? 'filled' : 'outlined'} onClick={() => {
						selectItemType(item);
					}}/>
				</Grid>
			))}
			</Grid>
		</Grid>
		{ query && (selectedType == 'Artists'
			? <InfiniteView key={selectedType}
				enableToggle
				view={'list'}
				query={() => searchArtistsQuery(query)}
				renderGridItem={(artist: Artist) => <ArtistTile key={artist.id} artist={artist}/>}
				renderListItem={(artist: Artist) => <ArtistItem key={artist.id} artist={artist}/>}
			/>
			: selectedType == 'Albums'
				? <InfiniteView key={selectedType}
					enableToggle
					view={'grid'}
					query={() => searchAlbumsQuery(query)}
					renderGridItem={(album: AlbumWithArtist) => <AlbumTile key={album.id} album={album}/>}
					renderListItem={(album: AlbumWithArtist) => <AlbumItem key={album.id} album={album}/>}
				/>
				: selectedType == 'Songs'
					? <InfiniteView key={selectedType}
						view='list'
						enableToggle={false}
						query={() => searchSongsQuery(query)}
						renderGridItem={(song: SongWithArtist) => <>A</>}
						renderListItem={(song: SongWithArtist) => <SongItem key={song.id} song={song}/>}
					/> : <></>
		)}
	</Box>
}
export default SearchPage;