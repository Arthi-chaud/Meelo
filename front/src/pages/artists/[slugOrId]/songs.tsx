import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import { useQuery, useQueryClient } from "../../../api/use-query";
import { SongSortingKeys } from "../../../models/song";
import { getOrderParams, getSortingFieldParams } from "../../../utils/sorting";
import BackgroundBlurhash from "../../../components/blurhash-background";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { artistIdentifier, sortBy, order },
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [API.getSongs({ artist: artistIdentifier }, { sortBy, order }, ['artist', 'featuring'])]
	};
});

const ArtistSongPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const getSongMainAlbum = (songId: number) => queryClient
		.fetchQuery(API.getMasterTrack(songId, ['release']))
		.then((track) => queryClient
			.fetchQuery(API.getAlbum(track.release.albumId)));
	const artistIdentifier = props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(API.getArtist, props.additionalProps?.artistIdentifier);

	return <Box sx={{ width: '100%' }}>
		<BackgroundBlurhash blurhash={artist.data?.illustration?.blurhash} />
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteSongView
			initialSortingField={props.additionalProps?.sortBy ?? 'name'}
			initialSortingOrder={props.additionalProps?.order ?? 'asc'}
			query={({ library, sortBy, order, type }) => API.getSongs(
				{ artist: artistIdentifier, type, library: library ?? undefined },
				{ sortBy, order },
				['artist', 'featuring']
			)}
			formatSubtitle={(song) => getSongMainAlbum(song.id).then((album) => album.name)}
		/>
	</Box>;
};

export default ArtistSongPage;
