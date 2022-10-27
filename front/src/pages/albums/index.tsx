import React, { useState } from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../api';
import Album, { AlbumSortingKeys, AlbumType, AlbumWithArtist } from '../../components/list-item/album';
import AlbumTile from '../../components/tile/album-tile';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-scroll';
import { QueryClient, dehydrate } from 'react-query';
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from '../../query';
import { getOrderParams, getSortingFieldParams, SortingParameters } from '../../utils/sorting';
import InfiniteAlbumView from '../../components/infinite/infinite-album-view';

const albumsQuery = (sort: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) => ({
	key: ["albums", sort, type ?? {}],
	exec: (lastPage: Page<Album>) => API.getAllAlbums<AlbumWithArtist>(lastPage, sort, type, ["artist"])
});

const libraryAlbumsQuery = (slugOrId: string | number, sort: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) => ({
	key: ["library", slugOrId, "albums", sort, type ?? {}],
	exec: (lastPage: Page<Album>) => API.getAllAlbumsInLibrary<AlbumWithArtist>(slugOrId, lastPage, type, sort, ["artist"])
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
	return <InfiniteAlbumView
		initialSortingField={getSortingFieldParams(router.query.sortBy, AlbumSortingKeys)}
		initialSortingOrder={getOrderParams(router.query.order)}
		initialView={(router.query.view == 'list' ? 'list' : 'grid')}
		query={(sort, type) => librarySlug ? libraryAlbumsQuery(librarySlug, sort, type) : albumsQuery(sort, type)}
	/>
} 

export default LibraryAlbumsPage;