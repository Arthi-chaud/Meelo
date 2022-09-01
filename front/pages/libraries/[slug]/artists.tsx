import React, { useState } from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import API from '../../../src/api';
import { useRouter } from 'next/router';
import Artist from '../../../src/models/artist';
import ArtistTile from '../../../src/components/tile/artist-tile';
import InfiniteGrid from '../../../src/components/infinite/infinite-grid';
import LoadingPage from '../../../src/components/loading/loading-page';
import { Box } from '@mui/material';
import LoadingComponent, { WideLoadingComponent } from '../../../src/components/loading/loading';

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	return <>
		<MeeloAppBar/>
		<InfiniteGrid
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage, pageSize) => API.getAllArtistsInLibrary(
				slug as string,
				{ index: lastPage?.index, pageSize: pageSize }
			)}
			queryKey={['libraries', slug as string, 'artists']}
			render={(item: Artist) => <ArtistTile artist={item} />}
		/>
	</>;
}


export default LibraryArtistsPage;