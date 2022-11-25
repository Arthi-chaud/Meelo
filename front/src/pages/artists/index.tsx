import React from 'react';
import API from '../../api/api';
import Artist, { ArtistSortingKeys } from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-scroll';
import {
	SortingParameters, getOrderParams, getSortingFieldParams
} from '../../utils/sorting';
import InfiniteArtistView from '../../components/infinite/infinite-artist-view';
import prepareSSR, { InferSSRProps } from '../../ssr';
import { useRouter } from 'next/router';

const artistsQuery = (sort: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: ["artists", sort],
	exec: (lastPage: Page<Artist>) => API.getAllArtists(lastPage, sort)
});

const libraryArtistsQuery = (
	slugOrId: string | number, sort: SortingParameters<typeof ArtistSortingKeys>
) => ({
	key: [
		"library",
		slugOrId,
		"artists",
		sort
	],
	exec: (lastPage: Page<Artist>) => API.getAllArtistsInLibrary(slugOrId, lastPage, sort)
});

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;

	return {
		additionalProps: { librarySlug },
		infiniteQueries: [
			librarySlug
				? libraryArtistsQuery(librarySlug, { sortBy, order })
				: artistsQuery({ sortBy, order })
		]
	};
});

const LibraryArtistsPage = (
	{ librarySlug }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteArtistView
		initialSortingField={getSortingFieldParams(router.query.sortBy, ArtistSortingKeys)}
		initialSortingOrder={getOrderParams(router.query.order)}
		initialView={(router.query.view == 'grid' ? 'grid' : 'list')}
		query={(sort) => librarySlug
			? libraryArtistsQuery(librarySlug, sort)
			: artistsQuery(sort)}
	/>;
};

export default LibraryArtistsPage;
