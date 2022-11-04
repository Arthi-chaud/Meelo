import { Box, Typography } from "@mui/material";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { QueryClient, dehydrate, useQuery } from "react-query";
import API from "../../api";
import { Page } from "../../components/infinite/infinite-scroll";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { WideLoadingComponent } from "../../components/loading/loading";
import RelationPageHeader from "../../components/relation-page-header/relation-page-header";
import Album, { AlbumSortingKeys, AlbumType } from "../../models/album";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import { SongWithArtist } from "../../models/song";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../query";
import getSlugOrId from "../../utils/getSlugOrId";
import { SortingParameters } from "../../utils/sorting";

const genreQuery = (idOrSlug: string | number) => ({
	key: ["genre", idOrSlug],
	exec: () => API.getGenre(idOrSlug)
});

const genreArtistsQuery = (slugOrId: string | number, sort?: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: ["genres", slugOrId, "artists", sort ?? {}],
	exec: (lastPage: Page<Artist>) => API.getGenreArtists(slugOrId, lastPage, sort)
});

const genreAlbumsQuery = (slugOrId: string | number, sort?: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) => ({
	key: ["genres", slugOrId, "albums", sort ?? {}, type ?? {}],
	exec: (lastPage: Page<Album>) => API.getGenreAlbums(slugOrId, lastPage, sort, type)
});

const genreSongsQuery = (slugOrId: string | number, sort?: SortingParameters<typeof AlbumSortingKeys>) => ({
	key: ["genres", slugOrId, "songs", sort ?? {}],
	exec: (lastPage: Page<SongWithArtist>) => API.getGenreSongs(slugOrId, lastPage, sort)
});


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const genreIdentifier = getSlugOrId(context.params);
	const queryClient = new QueryClient()
  
	await Promise.all([
		queryClient.prefetchQuery(prepareMeeloQuery(genreQuery, genreIdentifier)),
		queryClient.prefetchQuery(prepareMeeloInfiniteQuery(genreArtistsQuery, genreIdentifier)),
		queryClient.prefetchQuery(prepareMeeloInfiniteQuery(genreAlbumsQuery, genreIdentifier)),
		queryClient.prefetchQuery(prepareMeeloInfiniteQuery(genreSongsQuery, genreIdentifier)),
	]);
	return {
		props: {
			genreIdentifier,
			dehydratedState: dehydrate(queryClient),
		},
	}
}


const GenrePage = ({ genreIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	genreIdentifier ??= getSlugOrId(router.query);
	const genre = useQuery(prepareMeeloQuery(genreQuery, genreIdentifier));
	if (!genre.data)
		return <WideLoadingComponent/>
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
	</Box>
}

export default GenrePage;