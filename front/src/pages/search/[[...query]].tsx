import { Search } from "@mui/icons-material";
import {
	Box, InputAdornment, TextField
} from "@mui/material";
import { useState } from "react";
import API from '../../api/api';
import { Page } from '../../components/infinite/infinite-scroll';
import {
	AlbumSortingKeys, AlbumType, AlbumWithArtist
} from '../../models/album';
import Artist, { ArtistSortingKeys } from '../../models/artist';
import Song, { SongSortingKeys, SongWithArtist } from '../../models/song';
import { SortingParameters } from "../../utils/sorting";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { useRouter } from "next/router";
import prepareSSR, { InferSSRProps } from "../../ssr";

const searchArtistsQuery = (query: string, sort?: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: [
		"search",
		"artists",
		query,
		sort ?? {}
	],
	exec: (lastPage: Page<Artist>) => API.searchArtists(query, lastPage, sort)
});

const searchAlbumsQuery = (
	query: string, sort?: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType
) => ({
	key: [
		"search",
		"albums",
		query,
		sort ?? {},
		type ?? {}
	],
	exec: (lastPage: Page<AlbumWithArtist>) =>
		API.searchAlbums<AlbumWithArtist>(query, lastPage, type, sort, ['artist'])
});

const searchSongsQuery = (query: string, sort?: SortingParameters<typeof SongSortingKeys>) => ({
	key: [
		"search",
		"songs",
		query,
		sort ?? {}
	],
	exec: (lastPage: Page<Song>) => API.searchSongs<SongWithArtist>(query, lastPage, sort, ['artist'])
});

export const getServerSideProps = prepareSSR((context) => {
	const searchQuery = context.query.query as string ?? null;
	const type = context.query.type as string ?? null;

	return {
		additionalProps: { searchQuery, type },
		infiniteQueries: [
			searchArtistsQuery(searchQuery),
			searchAlbumsQuery(searchQuery),
			searchSongsQuery(searchQuery)
		]
	};
});

const buildSearchUrl = (query: string | undefined, type: string | undefined) => {
	return "/search/" + (query ?? '') + (type ? `?type=${type}` : '');
};

const SearchPage = (
	{ type, searchQuery }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	type ??= router.query.type as string;
	const [query, setQuery] = useState<string | undefined>(Array.from(
		searchQuery ?? router.query.query as string | undefined ?? []
	).join(' ') || undefined);

	return <Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 3, flexDirection: 'column' }}>
		<Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 2 }}>
			<TextField id="outlined-basic" label="Search" variant="outlined"
				autoFocus InputProps={{
					value: query,
					startAdornment: <InputAdornment position="start">
						<Search />
					</InputAdornment>
					,
				}} onChange={(error) => {
					setQuery(error.target.value || undefined);
					router.push(
						buildSearchUrl(error.target.value, type), undefined, { shallow: true }
					);
				}}/>
		</Box>
		<SelectableInfiniteView
			default={type}
			onTypeSelect={(selectedType) =>
				router.push(buildSearchUrl(query, selectedType), undefined, { shallow: true })}
			enabled={query != undefined}
			artistQuery={(sort) => searchArtistsQuery(encodeURIComponent(query!), sort)}
			albumQuery={(sort, selectedType) =>
				searchAlbumsQuery(encodeURIComponent(query!), sort, selectedType)
			}
			songQuery={(sort) => searchSongsQuery(encodeURIComponent(query!), sort)}
		/>
	</Box>;
};

export default SearchPage;
