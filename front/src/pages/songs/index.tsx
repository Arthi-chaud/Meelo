import React, { useState } from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box, Divider, List } from '@mui/material';
import InfiniteList from '../../components/infinite/infinite-list';
import { useRouter } from 'next/router';
import Song, { SongWithArtist } from '../../models/song';
import API from '../../api';
import SongItem from '../../components/list-item/song-item';
import LoadingPage from '../../components/loading/loading-page';
import { WideLoadingComponent } from '../../components/loading/loading';
import FadeIn from 'react-fade-in';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { dehydrate, QueryClient } from 'react-query';
import { prepareMeeloInfiniteQuery } from '../../query';
import { Page } from '../../components/infinite/infinite-scroll';
import InfiniteView from '../../components/infinite/infinite-view';
import { getOrderParams, getSortingFieldParams, SortingParameters } from '../../utils/sorting';

const SongSortingFields: (keyof Song)[] = ['name', 'playCount']

const songsQuery = (sort: SortingParameters<Song>) => ({
	key: ["songs", sort],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongs<SongWithArtist>(lastPage, sort, ['artist'])
});

const librarySongsQuery = (slugOrId: string | number, sort: SortingParameters<Song>) => ({
	key: ["library", slugOrId, "songs", sort],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongsInLibrary<SongWithArtist>(slugOrId, lastPage, sort, ['artist'])
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingFields);
	if (librarySlug) {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(librarySongsQuery, librarySlug, { sortBy, order }));
	} else {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(songsQuery, { sortBy, order }));
	}

	return {
		props: {
			librarySlug, 
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const LibrarySongsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	librarySlug ??= getLibrarySlug(router.asPath);
	const [order, setOrder] = useState(getOrderParams(router.query.order));
	const [sortBy, setSortBy] = useState(getSortingFieldParams(router.query.sortBy, SongSortingFields));
	return (
		<InfiniteView
			initialSortingField={sortBy}
			sortingFields={SongSortingFields}
			view='list'
			sortingOrder={order}
			query={() => librarySlug ? librarySongsQuery(librarySlug, { sortBy, order }) : songsQuery({ sortBy, order })}
			renderListItem={(item: SongWithArtist) => <SongItem song={item} key={item.id}/> }
			renderGridItem={(item: SongWithArtist) => <></> }
			onSortingFieldSelect={(newField) => setSortBy(newField)}
			onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
		/>
	);
}

export default LibrarySongsPage;