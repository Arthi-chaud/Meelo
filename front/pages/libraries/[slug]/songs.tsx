import React from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box } from '@mui/material';
import InfiniteList from '../../../src/components/infinite-list';
import { useRouter } from 'next/router';
import Song from '../../../src/models/song';
import API from '../../../src/api';

const LibrarySongsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	return <Box>
		<MeeloAppBar/>
		<InfiniteList
			fetch={(lastPage, pageSize) => API.getAllAlbumsInLibrary(
				slug as string,
				{ index: lastPage?.index, pageSize: pageSize }
			)}
			queryKey={['libraries', slug as string, 'songs']}
			render={(items: Song[]) => <></>}
		/>
	</Box>;
} 

export default LibrarySongsPage;