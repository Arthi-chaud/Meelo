import React from 'react';
import MeeloAppBar from "../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box, List } from '@mui/material';
import InfiniteList, { Page } from '../../src/components/infinite/infinite-list';
import { useRouter } from 'next/router';
import { SongWithArtist } from '../../src/models/song';
import API from '../../src/api';
import SongItem from '../../src/components/song-item';
import LoadingPage from '../../src/components/loading/loading-page';
import { WideLoadingComponent } from '../../src/components/loading/loading';
import FadeIn from 'react-fade-in';

const LibrarySongsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	const librarySlug = slug as string | undefined;
	return <Box>
		<MeeloAppBar/>
		<InfiniteList
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage, pageSize) => {
				if (librarySlug) {
					return API.getAllSongsInLibrary<SongWithArtist>(
						slug as string,
						{ index: lastPage?.index, pageSize: pageSize }, 
						['artist']
					)
				} else {
					return API.getAllSongs<SongWithArtist>(
						{ index: lastPage?.index, pageSize: pageSize },
						['artist']
					)
				}
			}}
			queryKey={librarySlug ? ['libraries', slug as string, 'songs'] :  ['songs']}
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