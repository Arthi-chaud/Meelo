import React from 'react';
import API from '../../api/api';
import { ArtistSortingKeys } from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import { useRouter } from 'next/router';
import InfiniteArtistView from '../../components/infinite/infinite-resource-view/infinite-artist-view';
import { getLayoutParams } from '../../utils/layout';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingKeys);
	const defaultLayout = getLayoutParams(context.query.view) ?? 'list';
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;

	return {
		additionalProps: { librarySlug, defaultLayout, sortBy, order },
		infiniteQueries: [
			librarySlug
				? API.getAllArtistsInLibrary(librarySlug, { sortBy, order })
				: API.getAllArtists({ sortBy, order })
		]
	};
});

const LibraryArtistsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const librarySlug = props.additionalProps?.librarySlug ?? getLibrarySlug(router.asPath);

	return <InfiniteArtistView
		initialSortingField={props.additionalProps?.sortBy}
		initialSortingOrder={props.additionalProps?.order}
		defaultLayout={props.additionalProps?.defaultLayout}
		query={(sort) => librarySlug
			? API.getAllArtistsInLibrary(librarySlug, sort)
			: API.getAllArtists(sort)}
	/>;
};

export default LibraryArtistsPage;
