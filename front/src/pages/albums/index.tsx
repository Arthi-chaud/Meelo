import React from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../api';
import InfiniteGrid from '../../components/infinite/infinite-grid';
import ArtistTile from '../../components/tile/artist-tile';
import Artist from '../../models/artist';
import Album from '../../models/album';
import AlbumTile from '../../components/tile/album-tile';
import LoadingPage from '../../components/loading/loading-page';
import LoadingComponent, { WideLoadingComponent } from '../../components/loading/loading';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-list';
import { QueryClient, dehydrate } from 'react-query';
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from '../../query';
import Resource from '../../models/resource';

const albumsQuery = () => ({
	key: ["albums"],
	exec: (lastPage: Page<Album>) => API.getAllAlbums(lastPage, ["artist"])
});

const libraryAlbumsQuery = (slugOrId: string | number) => ({
	key: ["library", slugOrId, "albums"],
	exec: (lastPage: Page<Album>) => API.getAllAlbumsInLibrary(slugOrId, lastPage, ["artist"])
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
	return <>
		<InfiniteGrid
			query={() => query}
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			render={(item: Album) => <AlbumTile album={item} />}
		/>
	</>;
} 

export default LibraryAlbumsPage;