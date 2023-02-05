import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import { useQueryClient } from "../../../api/use-query";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		infiniteQueries: [API.getArtistSongs(artistIdentifier, undefined, ['artist'])]
	};
});

const ArtistSongPage = (
	{ artistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const getSongMainAlbum = (songId: number) => queryClient
		.fetchQuery(API.getMasterTrack(songId, ['release']))
		.then((track) => queryClient
			.fetchQuery(API.getAlbum(track.release.albumId)));

	artistIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteSongView
			query={(sort) => API.getArtistSongs(artistIdentifier, sort, ['artist'])}
			formatSubtitle={(song) => getSongMainAlbum(song.id).then((album) => album.name)}
		/>
	</Box>;
};

export default ArtistSongPage;
