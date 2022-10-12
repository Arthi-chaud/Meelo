import React, { useState } from 'react';
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import API from '../../api';
import ArtistTile from '../../components/tile/artist-tile';
import Artist, { ArtistSortingKeys } from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { QueryClient, dehydrate } from 'react-query';
import { Page } from '../../components/infinite/infinite-scroll';
import { prepareMeeloInfiniteQuery } from '../../query';
import InfiniteView from '../../components/infinite/infinite-view';
import Illustration from '../../components/illustration';
import ListItem from '../../components/list-item/item';
import ArtistItem from '../../components/list-item/artist-item';
import { getOrderParams, getSortingFieldParams, SortingParameters } from '../../utils/sorting';
import InfiniteArtistView from '../../components/infinite/infinite-artist-view';

const artistsQuery = (sort: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: ["artists", sort],
	exec: (lastPage: Page<Artist>) => API.getAllArtists(lastPage, sort)
});

const libraryArtistsQuery = (slugOrId: string | number, sort: SortingParameters<typeof ArtistSortingKeys>) => ({
	key: ["library", slugOrId, "artists", sort],
	exec: (lastPage: Page<Artist>) => API.getAllArtistsInLibrary(slugOrId, lastPage, sort)
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	if (librarySlug) {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(libraryArtistsQuery, librarySlug, { sortBy, order }));
	} else {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(artistsQuery, { sortBy, order }));
	}

	return {
		props: {
			librarySlug, 
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const LibraryArtistsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	librarySlug ??= getLibrarySlug(router.asPath);
	const [order, setOrder] = useState(getOrderParams(router.query.order));
	const [sortBy, setSortBy] = useState(getSortingFieldParams(router.query.sortBy, ArtistSortingKeys));
	return <InfiniteArtistView
		initialSortingField={sortBy}
		initialSortingOrder={order}
		initialView={(router.query.view == 'grid' ? 'grid' : 'list')}
		query={(sort) => librarySlug ? libraryArtistsQuery(librarySlug, sort) : artistsQuery(sort)}
	/>
}


export default LibraryArtistsPage;