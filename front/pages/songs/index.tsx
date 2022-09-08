import React from 'react';
import MeeloAppBar from "../../src/components/appbar/appbar";
import { GetServerSidePropsContext, NextPage } from "next";
import { Box, List } from '@mui/material';
import InfiniteList, { Page } from '../../src/components/infinite/infinite-list';
import { useRouter } from 'next/router';
import { SongWithArtist } from '../../src/models/song';
import API from '../../src/api';
import SongItem from '../../src/components/song-item';
import LoadingPage from '../../src/components/loading/loading-page';
import { WideLoadingComponent } from '../../src/components/loading/loading';
import FadeIn from 'react-fade-in';
import getLibrarySlug from '../../src/utils/getLibrarySlug';
const LibrarySongsPage: NextPage = () => {
	const router = useRouter();
	const librarySlug = getLibrarySlug(router.asPath);
	return <Box>
		<InfiniteList
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage) => {
				if (librarySlug) {
					return API.getAllSongsInLibrary<SongWithArtist>(
						librarySlug,
						{ index: lastPage.index, pageSize: lastPage.pageSize },
						['artist']
					)
				} else {
					return API.getAllSongs<SongWithArtist>(
						{ index: lastPage.index, pageSize: lastPage.pageSize },
						['artist']
					)
				}
			}}
			queryKey={librarySlug ? ['libraries', librarySlug, 'songs'] :  ['songs']}
			render={(items: SongWithArtist[]) =>
				<FadeIn>
					<List sx={{ padding: 3 }}>
						{ items.map((item) => <SongItem song={item} key={item.id}/>)}
					</List>
				</FadeIn>
			}
		/>
	</Box>;
} 

export default LibrarySongsPage;