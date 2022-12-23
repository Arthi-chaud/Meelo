import { Box, Typography } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../api/api";
import { Page } from "../../components/infinite/infinite-scroll";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { WideLoadingComponent } from "../../components/loading/loading";
import Album, { AlbumSortingKeys, AlbumType } from "../../models/album";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import { SongSortingKeys, SongWithArtist } from "../../models/song";
import { useQuery } from "../../api/use-query";
import getSlugOrId from "../../utils/getSlugOrId";
import { SortingParameters } from "../../utils/sorting";
import prepareSSR, { InferSSRProps } from "../../ssr";
import LoadingPage from "../../components/loading/loading-page";

const genreQuery = (idOrSlug: string | number) => ({
	key: ["genre", idOrSlug],
	exec: () => API.getGenre(idOrSlug)
});

const genreArtistsQuery = (
	slugOrId: string | number, sort?: SortingParameters<typeof ArtistSortingKeys>
) => ({
	key: [
		"genres",
		slugOrId,
		"artists",
		sort ?? {}
	],
	exec: (lastPage: Page<Artist>) => API.getGenreArtists(slugOrId, lastPage, sort)
});

const genreAlbumsQuery = (
	slugOrId: string | number, sort?: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType
) => ({
	key: [
		"genres",
		slugOrId,
		"albums",
		sort ?? {},
		type ?? {}
	],
	exec: (lastPage: Page<Album>) => API.getGenreAlbums(slugOrId, lastPage, sort, type)
});

const genreSongsQuery = (
	slugOrId: string | number, sort?: SortingParameters<typeof SongSortingKeys>
) => ({
	key: [
		"genres",
		slugOrId,
		"songs",
		sort ?? {}
	],
	exec: (lastPage: Page<SongWithArtist>) => API.getGenreSongs(slugOrId, lastPage, sort)
});

export const getServerSideProps = prepareSSR((context) => {
	const genreIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { genreIdentifier },
		queries: [genreQuery(genreIdentifier)],
		infiniteQueries: [
			genreArtistsQuery(genreIdentifier),
			genreAlbumsQuery(genreIdentifier),
			genreSongsQuery(genreIdentifier)
		]
	};
});

const GenrePage = ({ genreIdentifier }: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();

	genreIdentifier ??= getSlugOrId(router.query);
	const genre = useQuery(genreQuery, genreIdentifier);

	if (!genre.data) {
		return <LoadingPage/>;
	}
	return <Box sx={{ width: '100%' }}>
		<Box sx={{ width: '100%', justifyContent: "center", textAlign: 'center', padding: 4 }}>
			<Typography variant='h5' sx={{ fontWeight: 'bold' }}>
				{genre.data.name}
			</Typography>
		</Box>
		<Box sx={{ padding: 1 }}/>
		<SelectableInfiniteView
			enabled={true}
			artistQuery={(sort) => genreArtistsQuery(genreIdentifier, sort)}
			albumQuery={(sort, type) => genreAlbumsQuery(genreIdentifier, sort, type)}
			songQuery={(sort) => genreSongsQuery(genreIdentifier, sort)}
		/>
	</Box>;
};

export default GenrePage;
