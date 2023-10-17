import React from 'react';
import API from '../../api/api';
import { ArtistSortingKeys } from '../../models/artist';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import { useRouter } from 'next/router';
import InfiniteArtistView from '../../components/infinite/infinite-resource-view/infinite-artist-view';
import { getLayoutParams } from '../../utils/layout';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingKeys);
	const defaultLayout = getLayoutParams(context.query.view) ?? 'list';

	return {
		additionalProps: { defaultLayout, sortBy, order },
		infiniteQueries: [API.getArtists({}, { sortBy, order })]
	};
});

const LibraryArtistsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();

	return <InfiniteArtistView
		initialSortingField={props.additionalProps?.sortBy}
		initialSortingOrder={props.additionalProps?.order}
		defaultLayout={props.additionalProps?.defaultLayout}
		query={({ library, sortBy, order }) => API.getArtists(
			{ library: library ?? undefined }, { sortBy, order }
		)}
	/>;
};

export default LibraryArtistsPage;
