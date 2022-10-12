import React, { useState } from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../api';
import Album, { AlbumSortingKeys, AlbumWithArtist } from '../../models/album';
import AlbumTile from '../../components/tile/album-tile';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-scroll';
import { QueryClient, dehydrate } from 'react-query';
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from '../../query';
import { getOrderParams, getSortingFieldParams, SortingParameters } from '../../utils/sorting';
import InfiniteAlbumView from '../../components/infinite/infinite-album-view';

const albumsQuery = (sort: SortingParameters<typeof AlbumSortingKeys>) => ({
	key: ["albums", sort],
	exec: (lastPage: Page<Album>) => API.getAllAlbums<AlbumWithArtist>(lastPage, sort, ["artist"])
});

const libraryAlbumsQuery = (slugOrId: string | number, sort: SortingParameters<typeof AlbumSortingKeys>) => ({
	key: ["library", slugOrId, "albums", sort],
	exec: (lastPage: Page<Album>) => API.getAllAlbumsInLibrary<AlbumWithArtist>(slugOrId, lastPage, sort, ["artist"])
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, AlbumSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	if (librarySlug) {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(libraryAlbumsQuery, librarySlug, { sortBy, order }));
	} else {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(albumsQuery, { sortBy, order }));
	}

	return {
		props: {
			librarySlug, 
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const LibraryAlbumsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	librarySlug ??= getLibrarySlug(router.asPath);
	const [order, setOrder] = useState(getOrderParams(router.query.order));
	const [sortBy, setSortBy] = useState(getSortingFieldParams(router.query.sortBy, AlbumSortingKeys));
	return <InfiniteAlbumView
		initialSortingField={sortBy}
		initialSortingOrder={order}
		initialView={(router.query.view == 'list' ? 'list' : 'grid')}
		query={(sort) => librarySlug ? libraryAlbumsQuery(librarySlug, sort) : albumsQuery(sort)}
	/>
} 

export default LibraryAlbumsPage;