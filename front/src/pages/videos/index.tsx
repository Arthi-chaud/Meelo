import React from 'react';
import { useRouter } from 'next/router';
import { SongSortingKeys } from '../../models/song';
import API from '../../api/api';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR from '../../ssr';
import InfiniteVideoView from '../../components/infinite/infinite-resource-view/infinite-video-view';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: {},
		infiniteQueries: [API.getVideos({}, { sortBy, order }, ['artist', 'featuring'])]
	};
});

const LibraryVideosPage = () => {
	const router = useRouter();

	return <InfiniteVideoView
		query={({ library, sortBy, order }) => API.getVideos(
			{ library: library ?? undefined }, { sortBy, order }, ['artist', 'featuring']
		)}
		formatSubtitle={(video) => video.artist.name}
	/>;
};

export default LibraryVideosPage;
