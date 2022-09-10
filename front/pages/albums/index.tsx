import React from 'react';
import MeeloAppBar from "../../src/components/appbar/appbar";
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../src/api';
import InfiniteGrid from '../../src/components/infinite/infinite-grid';
import ArtistTile from '../../src/components/tile/artist-tile';
import Artist from '../../src/models/artist';
import Album from '../../src/models/album';
import AlbumTile from '../../src/components/tile/album-tile';
import LoadingPage from '../../src/components/loading/loading-page';
import LoadingComponent, { WideLoadingComponent } from '../../src/components/loading/loading';
import getLibrarySlug from '../../src/utils/getLibrarySlug';
import { Page } from '../../src/components/infinite/infinite-list';
import { QueryClient, dehydrate } from 'react-query';
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from '../../src/query';
import Resource from '../../src/models/resource';

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
			dehydratedState: dehydrate(queryClient),
		},
	}
}

const LibraryAlbumsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const query = librarySlug ? libraryAlbumsQuery(librarySlug) : albumsQuery();
	return <>
		<InfiniteGrid
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage: Page<Album>) => query.exec(lastPage)}
			queryKey={query.key}
			render={(item: Album) => <AlbumTile album={item} />}
		/>
	</>;
} 

export default LibraryAlbumsPage;