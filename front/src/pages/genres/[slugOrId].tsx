import { Box, Typography } from "@mui/material";
import { useRouter } from "next/router";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { useQuery } from "../../api/use-query";
import getSlugOrId from "../../utils/getSlugOrId";
import prepareSSR, { InferSSRProps } from "../../ssr";
import LoadingPage from "../../components/loading/loading-page";
import API from "../../api/api";

export const getServerSideProps = prepareSSR((context) => {
	const genreIdentifier = getSlugOrId(context.params);
	const defaultQuerySortParams = { sortBy: 'name', order: 'asc' } as const;

	return {
		additionalProps: { genreIdentifier },
		queries: [API.getGenre(genreIdentifier)],
		infiniteQueries: [
			API.getAlbums({ genre: genreIdentifier }, defaultQuerySortParams),
			API.getArtists({ genre: genreIdentifier }, defaultQuerySortParams),
			API.getSongs({ genre: genreIdentifier }, defaultQuerySortParams)
		]
	};
});

const GenrePage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const genreIdentifier = props.additionalProps?.genreIdentifier ?? getSlugOrId(router.query);
	const genre = useQuery(API.getGenre, genreIdentifier);

	if (!genre.data) {
		return <LoadingPage/>;
	}
	return <Box sx={{ width: '100%' }}>
		<Box sx={{ width: '100%', justifyContent: "center", textAlign: 'center', marginY: 5 }}>
			<Typography variant='h5' sx={{ fontWeight: 'bold' }}>
				{genre.data.name}
			</Typography>
		</Box>
		<SelectableInfiniteView
			enabled={true}
			artistQuery={({ library }, { sortBy, order }) => API.getArtists(
				{ genre: genreIdentifier, library: library ?? undefined }, { sortBy, order }
			)}
			albumQuery={({ library, type }, { sortBy, order }) => API.getAlbums(
				{ genre: genreIdentifier, type, library: library ?? undefined }, { sortBy, order }, ['artist']
			)}
			songQuery={({ library, type }, { sortBy, order }) => API.getSongs(
				{ genre: genreIdentifier, type, library: library ?? undefined },
				{ sortBy, order },
				['artist']
			)}
		/>
	</Box>;
};

export default GenrePage;
