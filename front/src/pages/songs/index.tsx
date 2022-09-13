import React from 'react';
import MeeloAppBar from "../../components/appbar/appbar";
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from "next";
import { Box, Divider, List } from '@mui/material';
import InfiniteList, { Page } from '../../components/infinite/infinite-list';
import { useRouter } from 'next/router';
import Song, { SongWithArtist } from '../../models/song';
import API from '../../api';
import SongItem from '../../components/song-item';
import LoadingPage from '../../components/loading/loading-page';
import { WideLoadingComponent } from '../../components/loading/loading';
import FadeIn from 'react-fade-in';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { dehydrate, QueryClient } from 'react-query';
import { prepareMeeloInfiniteQuery } from '../../query';

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
	return <Box>
		<InfiniteList
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			query={() => query}
			render={(items: SongWithArtist[]) =>
				<FadeIn>
					<List sx={{ padding: 3}}>
						{items.map((item) => <>
							<SongItem song={item} key={item.id}/>
							<Divider variant='middle'/>
						</>)}
					</List>
				</FadeIn>
			}
		/>
	</Box>;
}

export default LibrarySongsPage;