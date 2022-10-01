import React, { useState } from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../api';
import Album, { AlbumWithArtist } from '../../models/album';
import AlbumTile from '../../components/tile/album-tile';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-scroll';
import { QueryClient, dehydrate } from 'react-query';
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from '../../query';
import InfiniteView from '../../components/infinite/infinite-view';
import ListItem from '../../components/list-item/item';
import Illustration from '../../components/illustration';
import InfiniteList from '../../components/infinite/infinite-list';
import Release from '../../models/release';
import Resource from '../../models/resource';
import AlbumItem from '../../components/list-item/album-item';
import { getOrderParams, getSortingFieldParams, SortingParameters } from '../../utils/sorting';

const AlbumSortingFields: (keyof Album)[] = ['name', 'releaseDate'];


const albumsQuery = (sort: SortingParameters<Album>) => ({
	key: ["albums", sort],
	exec: (lastPage: Page<Album>) => API.getAllAlbums<AlbumWithArtist>(lastPage, sort, ["artist"])
});

const libraryAlbumsQuery = (slugOrId: string | number, sort: SortingParameters<Album>) => ({
	key: ["library", slugOrId, "albums", sort],
	exec: (lastPage: Page<Album>) => API.getAllAlbumsInLibrary<AlbumWithArtist>(slugOrId, lastPage, sort, ["artist"])
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, AlbumSortingFields);
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
	const [sortBy, setSortBy] = useState(getSortingFieldParams(router.query.sortBy, AlbumSortingFields));
	return (
		<InfiniteView
			initialSortingField={sortBy}
			sortingOrder={order}
			sortingFields={AlbumSortingFields}
			enableToggle
			view={(router.query.view == 'list' ? 'list' : 'grid')}
			query={() => librarySlug ? libraryAlbumsQuery(librarySlug, { sortBy, order }) : albumsQuery({ sortBy, order })}
			renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} key={item.id} />}
			renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} key={item.id} />}
			onSortingFieldSelect={(newField) => setSortBy(newField)}
			onSortingOrderSelect={(newOrder) => setOrder(newOrder)}/>
	);
} 

export default LibraryAlbumsPage;