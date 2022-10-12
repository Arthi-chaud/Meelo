import React, { useState } from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box, Divider, List } from '@mui/material';
import InfiniteList from '../../components/infinite/infinite-list';
import { useRouter } from 'next/router';
import Song, { SongSortingKeys, SongWithArtist } from '../../models/song';
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
import InfiniteSongView from '../../components/infinite/infinite-song-view';

const SongSortingFields: (keyof Song)[] = ['name', 'playCount']

const songsQuery = (sort: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["songs", sort],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongs<SongWithArtist>(lastPage, sort, ['artist'])
});

const librarySongsQuery = (slugOrId: string | number, sort: SortingParameters<typeof SongSortingKeys>) => ({
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
	return <InfiniteSongView
		initialSortingField={getSortingFieldParams(router.query.sortBy, SongSortingFields)}
		initialSortingOrder={getOrderParams(router.query.order)}
		query={(sort) => librarySlug ? librarySongsQuery(librarySlug, sort) : songsQuery(sort)}
	/>
}

export default LibrarySongsPage;