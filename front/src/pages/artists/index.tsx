import React, { useState } from 'react';
import { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import API from '../../api';
import ArtistTile from '../../components/tile/artist-tile';
import Artist from '../../models/artist';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { QueryClient, dehydrate } from 'react-query';
import { Page } from '../../components/infinite/infinite-scroll';
import { prepareMeeloInfiniteQuery } from '../../query';
import InfiniteView from '../../components/infinite/infinite-view';
import Illustration from '../../components/illustration';
import ListItem from '../../components/list-item/item';
import ArtistItem from '../../components/list-item/artist-item';

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
	const router = useRouter();
	return (
		<InfiniteView
			view={(router.query.view as string) ?? 'grid'}
			query={() => query}
			renderListItem={(item: Artist) => <ArtistItem artist={item} key={item.id}/>}
			renderGridItem={(item: Artist) => <ArtistTile artist={item} key={item.id}/>}
		/>
	);
}


export default LibraryArtistsPage;