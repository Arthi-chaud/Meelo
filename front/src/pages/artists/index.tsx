import React, { useState } from 'react';
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import API from '../../api';
import ArtistTile from '../../components/tile/artist-tile';
import Artist from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { QueryClient, dehydrate } from 'react-query';
import { Page } from '../../components/infinite/infinite-scroll';
import { prepareMeeloInfiniteQuery } from '../../query';
import InfiniteView from '../../components/infinite/infinite-view';
import Illustration from '../../components/illustration';
import ListItem from '../../components/list-item/item';
import ArtistItem from '../../components/list-item/artist-item';
import { getOrderParams, getSortingFieldParams, SortingParameters } from '../../utils/sorting';

const ArtistSortingFields: (keyof Artist)[] = ['name'];

const artistsQuery = (sort: SortingParameters<Artist>) => ({
	key: ["artists", sort],
	exec: (lastPage: Page<Artist>) => API.getAllArtists(lastPage, sort)
});

const libraryArtistsQuery = (slugOrId: string | number, sort: SortingParameters<Artist>) => ({
	key: ["library", slugOrId, "artists", sort],
	exec: (lastPage: Page<Artist>) => API.getAllArtistsInLibrary(slugOrId, lastPage, sort)
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, ArtistSortingFields);
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
	const [order, setOrder] = useState(getOrderParams(router.query.order));
	const [sortBy, setSortBy] = useState(getSortingFieldParams(router.query.sortBy, ArtistSortingFields));
	return (
		<InfiniteView
			sortingFields={ArtistSortingFields}
			enableToggle
			view={router.query.view == 'list' ? 'list' : 'grid'}
			query={() => librarySlug ? libraryArtistsQuery(librarySlug, { sortBy, order }) : artistsQuery({ sortBy, order })}
			renderListItem={(item: Artist) => <ArtistItem artist={item} key={item.id} />}
			renderGridItem={(item: Artist) => <ArtistTile artist={item} key={item.id} />}
			onSortingFieldSelect={(newField) => setSortBy(newField)}
			onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
		/>
	);
}


export default LibraryArtistsPage;