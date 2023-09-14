import { useRouter } from "next/router";
import API from "../../../api/api";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import InfiniteVideoView from "../../../components/infinite/infinite-resource-view/infinite-video-view";
import formatDuration from "../../../utils/formatDuration";
import { SongSortingKeys } from "../../../models/song";
import { getOrderParams, getSortingFieldParams } from "../../../utils/sorting";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { artistIdentifier, order, sortBy },
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [API.getArtistVideos(artistIdentifier, ['artist'], { sortBy: 'name', order: 'asc' })]
	};
});

const ArtistSongPage = (
	props: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();
	const artistIdentifier = props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);

	return <>
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteVideoView
			initialSortingField={props.additionalProps?.sortBy}
			initialSortingOrder={props.additionalProps?.order}
			query={(sort) => API.getArtistVideos(artistIdentifier, ['artist'], sort)}
			formatSubtitle={(song) => formatDuration(song.track.duration)}
		/>
	</>;
};

export default ArtistSongPage;
