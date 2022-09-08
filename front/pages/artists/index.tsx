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
import getLibrarySlug from '../../src/utils/getLibrarySlug';

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const librarySlug = getLibrarySlug(router.asPath);
	return <>
		<InfiniteGrid
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage, pageSize) => {
				if (librarySlug) {
					return API.getAllArtistsInLibrary(
						librarySlug,
						{ index: lastPage?.index, pageSize: pageSize }
					)
				} else {
					return API.getAllArtists(
						{ index: lastPage?.index, pageSize: pageSize }
					)
				}
			}}
			queryKey={librarySlug ? ['libraries', librarySlug, 'artists'] : ['artists']}
			render={(item: Artist) => <ArtistTile artist={item} />}
		/>
	</>;
}


export default LibraryArtistsPage;