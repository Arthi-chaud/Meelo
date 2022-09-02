import React from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InfiniteList from '../../../src/components/infinite/infinite-list';
import { useRouter } from 'next/router';
import Song, { SongWithArtist } from '../../../src/models/song';
import API from '../../../src/api';
import { maxHeight } from '@mui/system';
import SongItem from '../../../src/components/song-item';
import LoadingPage from '../../../src/components/loading/loading-page';
import LoadingComponent, { WideLoadingComponent } from '../../../src/components/loading/loading';
import FadeIn from 'react-fade-in';

const LibrarySongsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	return <Box>
		<MeeloAppBar/>
		<InfiniteList
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage, pageSize) => API.getAllSongsInLibrary(
				slug as string,
				{ index: lastPage?.index, pageSize: pageSize }
			)}
			queryKey={['libraries', slug as string, 'songs']}
			render={(items: SongWithArtist[]) =>
				<FadeIn>
					<List sx={{ padding: 3 }}>
						{ items.map((item) => <SongItem song={item}/>)}
					</List>
				</FadeIn>
			}
		/>
	</Box>;
} 

export default LibrarySongsPage;