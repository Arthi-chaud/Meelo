import React from 'react';
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

const songsQuery = () => ({
	key: ["songs"],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongs<SongWithArtist>(lastPage, ['artist'])
});

const librarySongsQuery = (slugOrId: string | number) => ({
	key: ["library", slugOrId, "songs"],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongsInLibrary<SongWithArtist>(slugOrId, lastPage, ['artist'])
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	if (librarySlug) {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(librarySongsQuery, librarySlug));
	} else {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(songsQuery));
	}

	return {
		props: {
			librarySlug, 
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const LibrarySongsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const query = librarySlug ? librarySongsQuery(librarySlug) : songsQuery();
	return (
		<InfiniteView
			view='list'
			query={() => query}
			renderListItem={(item: SongWithArtist) => <SongItem song={item} key={item.id}/> }
			renderGridItem={(item: SongWithArtist) => <></> }
		/>
	);
}

export default LibrarySongsPage;