import React from 'react';
import MeeloAppBar from "../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import API from '../../src/api';
import InfiniteGrid from '../../src/components/infinite/infinite-grid';
import ArtistTile from '../../src/components/tile/artist-tile';
import Artist from '../../src/models/artist';
import Album from '../../src/models/album';
import AlbumTile from '../../src/components/tile/album-tile';
import LoadingPage from '../../src/components/loading/loading-page';
import LoadingComponent, { WideLoadingComponent } from '../../src/components/loading/loading';
import getLibrarySlug from '../../src/utils/getLibrarySlug';

const LibraryAlbumsPage: NextPage = () => {
	const router = useRouter();
	const librarySlug = getLibrarySlug(router.asPath);
	return <>
		<InfiniteGrid
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			fetch={(lastPage, pageSize) => {
				if (librarySlug) {
					return API.getAllAlbumsInLibrary(
						librarySlug,
						{ index: lastPage?.index, pageSize: pageSize },
						['artist']
					)
				} else {
					return API.getAllAlbums(
						{ index: lastPage?.index, pageSize: pageSize }, 
						['artist']
					)
				}
			}}
			queryKey={librarySlug ? ['libraries', librarySlug, 'albums'] : ['albums']}
			render={(item: Album) => <AlbumTile album={item} />}
		/>
	</>;
} 

export default LibraryAlbumsPage;