import React from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../../src/api';
import { InfiniteGrid } from '../../../src/components/infinite-list';
import ArtistTile from '../../../src/components/tile/artist-tile';
import Artist from '../../../src/models/artist';
import Album from '../../../src/models/album';
import AlbumTile from '../../../src/components/tile/album-tile';

const LibraryAlbumsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	return <>
		<MeeloAppBar/>
		<InfiniteGrid
			fetch={(lastPage, pageSize) => API.getAllAlbumsInLibrary(
				slug as string,
				{ skip: pageSize * (lastPage?.index ?? 0), take: pageSize }
			)}
			queryKey={['libraries', slug as string, 'albums']}
			render={(item: Album) => <AlbumTile album={item} />}
		/>
	</>;
} 

export default LibraryAlbumsPage;