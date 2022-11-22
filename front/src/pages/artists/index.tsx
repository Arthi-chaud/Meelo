import React, { useState } from 'react';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from 'next/router';
import API from '../../api/api';
import Artist, { ArtistSortingKeys } from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { QueryClient, dehydrate } from 'react-query';
import { Page } from '../../components/infinite/infinite-scroll';
import { prepareMeeloInfiniteQuery } from '../../api/use-query';
import {
	SortingParameters, getOrderParams, getSortingFieldParams
} from '../../utils/sorting';
import InfiniteArtistView from '../../components/infinite/infinite-artist-view';

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

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;

	if (librarySlug) {
		queryClient.prefetchInfiniteQuery(
			prepareMeeloInfiniteQuery(libraryArtistsQuery, librarySlug, { sortBy, order })
		);
	} else {
		queryClient.prefetchInfiniteQuery(
			prepareMeeloInfiniteQuery(artistsQuery, { sortBy, order })
		);
	}

	return {
		props: {
			librarySlug,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	};
};

const LibraryArtistsPage = (
	{ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteArtistView
		initialSortingField={getSortingFieldParams(router.query.sortBy, ArtistSortingKeys)}
		initialSortingOrder={getOrderParams(router.query.order)}
		initialView={(router.query.view == 'grid' ? 'grid' : 'list')}
		query={(sort) => librarySlug ? libraryArtistsQuery(librarySlug, sort) : artistsQuery(sort)}
	/>;
};

export default LibraryArtistsPage;
