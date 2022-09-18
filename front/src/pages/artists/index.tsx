import React, { useState } from 'react';
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import API from '../../api';
import MeeloAppBar from '../../components/appbar/appbar';
import InfiniteGrid from '../../components/infinite/infinite-grid';
import { WideLoadingComponent } from '../../components/loading/loading';
import LoadingPage from '../../components/loading/loading-page';
import ArtistTile from '../../components/tile/artist-tile';
import Artist from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { QueryClient, dehydrate } from 'react-query';
import { Page } from '../../components/infinite/infinite-scroll';
import { prepareMeeloInfiniteQuery } from '../../query';

const artistsQuery = () => ({
	key: ["artists"],
	exec: (lastPage: Page<Artist>) => API.getAllArtists(lastPage)
});

const libraryArtistsQuery = (slugOrId: string | number) => ({
	key: ["library", slugOrId, "artists"],
	exec: (lastPage: Page<Artist>) => API.getAllArtistsInLibrary(slugOrId, lastPage)
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const queryClient = new QueryClient();
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	if (librarySlug) {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(libraryArtistsQuery, librarySlug));
	} else {
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(artistsQuery));
	}

	return {
		props: {
			librarySlug, 
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const LibraryArtistsPage = ({ librarySlug }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const query = librarySlug ? libraryArtistsQuery(librarySlug) : artistsQuery();
	return <>
		<InfiniteGrid
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			query={() => query}
			render={(item: Artist) => <ArtistTile artist={item} />}
		/>
	</>;
}


export default LibraryArtistsPage;