import React from 'react';
import API from '../../api/api';
import { ArtistSortingKeys } from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import { useRouter } from 'next/router';
import InfiniteArtistView from '../../components/infinite/infinite-resource-view/infinite-artist-view';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;

	return {
		additionalProps: { librarySlug },
		infiniteQueries: [
			librarySlug
				? API.getAllArtistsInLibrary(librarySlug, { sortBy, order })
				: API.getAllArtists({ sortBy, order })
		]
	};
});

const LibraryArtistsPage = (
	{ librarySlug }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteArtistView
		defaultLayout='list'
		query={(sort) => librarySlug
			? API.getAllArtistsInLibrary(librarySlug, sort)
			: API.getAllArtists(sort)}
	/>;
};

export default LibraryArtistsPage;
