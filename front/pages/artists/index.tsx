import React, { useState } from 'react';
import { NextPage } from "next";
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import API from '../../src/api';
import MeeloAppBar from '../../src/components/appbar/appbar';
import InfiniteGrid from '../../src/components/infinite/infinite-grid';
import { WideLoadingComponent } from '../../src/components/loading/loading';
import LoadingPage from '../../src/components/loading/loading-page';
import ArtistTile from '../../src/components/tile/artist-tile';
import Artist from '../../src/models/artist';

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	const librarySlug = slug as string | undefined;
	return <>
		<InfiniteGrid
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage, pageSize) => {
				if (librarySlug) {
					return API.getAllArtistsInLibrary(
						slug as string,
						{ index: lastPage?.index, pageSize: pageSize }
					)
				} else {
					return API.getAllArtists(
						{ index: lastPage?.index, pageSize: pageSize }
					)
				}
			}}
			queryKey={librarySlug ? ['libraries', slug as string, 'artists'] : ['artists']}
			render={(item: Artist) => <ArtistTile artist={item} />}
		/>
	</>;
}


export default LibraryArtistsPage;