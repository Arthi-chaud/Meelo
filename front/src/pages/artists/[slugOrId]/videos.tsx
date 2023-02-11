import { useRouter } from "next/router";
import API from "../../../api/api";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import InfiniteVideoView from "../../../components/infinite/infinite-resource-view/infinite-video-view";
import formatDuration from "../../../utils/formatDuration";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { artistIdentifier },
		infiniteQueries: [API.getArtistVideos(artistIdentifier, ['artist'])]
	};
});

const ArtistSongPage = (
	{ artistIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	artistIdentifier ??= getSlugOrId(router.query);
	return <>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteVideoView
			query={(sort) => API.getArtistVideos(artistIdentifier, ['artist'], sort)}
			formatSubtitle={(song) => formatDuration(song.video.duration)}
		/>
	</>;
};

export default ArtistSongPage;
