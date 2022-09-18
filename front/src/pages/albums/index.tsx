import React from 'react';
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

const albumsQuery = () => ({
	key: ["albums"],
	exec: (lastPage: Page<Album>) => API.getAllAlbums<AlbumWithArtist>(lastPage, ["artist"])
});

const libraryAlbumsQuery = (slugOrId: string | number) => ({
	key: ["library", slugOrId, "albums"],
	exec: (lastPage: Page<Album>) => API.getAllAlbumsInLibrary<AlbumWithArtist>(slugOrId, lastPage, ["artist"])
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	if (librarySlug) {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(libraryAlbumsQuery, librarySlug));
	} else {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(albumsQuery));
	}

	return {
		props: {
			librarySlug, 
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const LibraryAlbumsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const query = librarySlug ? libraryAlbumsQuery(librarySlug) : albumsQuery();
	return (
		<InfiniteView
			view='grid'
			query={() => query}
			renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} />}
			renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} />}
		/>
	);
} 

export default LibraryAlbumsPage;