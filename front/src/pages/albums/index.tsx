import React from 'react';
import { useRouter } from 'next/router';
import API from '../../api/api';
import { AlbumSortingKeys } from '../../models/album';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import InfiniteAlbumView from '../../components/infinite/infinite-resource-view/infinite-album-view';
import prepareSSR, { InferSSRProps } from '../../ssr';
import { getLayoutParams } from '../../utils/layout';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, AlbumSortingKeys);
	const defaultLayout = getLayoutParams(context.query.view) ?? 'grid';

	return {
		additionalProps: { sortBy, order, defaultLayout },
		infiniteQueries: [API.getAlbums({}, { sortBy, order }, ["artist"])]
	};
});

const LibraryAlbumsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();

	return <InfiniteAlbumView
		initialSortingField={props.additionalProps?.sortBy}
		initialSortingOrder={props.additionalProps?.order}
		defaultLayout={props.additionalProps?.defaultLayout}
		query={({ sortBy, order, type, library }) => API.getAlbums(
			{ type, library: library ?? undefined },
			{ sortBy, order },
			['artist']
		)}
	/>;
};

export default LibraryAlbumsPage;
