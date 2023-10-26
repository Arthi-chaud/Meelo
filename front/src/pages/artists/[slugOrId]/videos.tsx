import { useRouter } from "next/router";
import API from "../../../api/api";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";
import InfiniteVideoView from "../../../components/infinite/infinite-resource-view/infinite-video-view";
import formatDuration from "../../../utils/formatDuration";
import { SongSortingKeys } from "../../../models/song";
import { getOrderParams, getSortingFieldParams } from "../../../utils/sorting";
import { useQuery } from "../../../api/use-query";
import BackgroundBlurhash from "../../../components/blurhash-background";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { artistIdentifier, order, sortBy },
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [API.getVideos({ artist: artistIdentifier }, { sortBy: 'name', order: 'asc' }, ['artist'])]
	};
});

const ArtistSongPage = (
	props: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();
	const artistIdentifier = props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(API.getArtist, props.additionalProps?.artistIdentifier);

	return <>
		<BackgroundBlurhash blurhash={artist.data?.illustration?.blurhash} />
		<ArtistRelationPageHeader artistSlugOrId={artistIdentifier}/>
		<InfiniteVideoView
			initialSortingField={props.additionalProps?.sortBy}
			initialSortingOrder={props.additionalProps?.order}
			query={(sort) => API.getVideos({ artist: artistIdentifier }, sort, ['artist'])}
			formatSubtitle={(song) => formatDuration(song.track.duration)}
		/>
	</>;
};

export default ArtistSongPage;
