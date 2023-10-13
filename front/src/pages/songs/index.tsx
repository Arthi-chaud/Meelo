import React from 'react';
import { useRouter } from 'next/router';
import { SongSortingKeys } from '../../models/song';
import API from '../../api/api';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import InfiniteSongView from '../../components/infinite/infinite-resource-view/infinite-song-view';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { order, sortBy },
		infiniteQueries: [API.getSongs({}, { sortBy, order }, ['artist'])]
	};
});

const LibrarySongsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();

	return <InfiniteSongView
		initialSortingField={props.additionalProps?.sortBy}
		initialSortingOrder={props.additionalProps?.order}
		query={({ sortBy, order, type, library }) => API.getSongs(
			{ type, library: library ?? undefined },
			{ sortBy, order },
			['artist']
		)}
	/>;
};

export default LibrarySongsPage;
