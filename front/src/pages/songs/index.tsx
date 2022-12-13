import React from 'react';
import { useRouter } from 'next/router';
import { SongSortingKeys, SongWithArtist } from '../../models/song';
import API from '../../api/api';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-scroll';
import {
	SortingParameters, getOrderParams, getSortingFieldParams
} from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import InfiniteSongView from '../../components/infinite/infinite-resource-view/infinite-song-view';

const songsQuery = (sort: SortingParameters<typeof SongSortingKeys>) => ({
	key: ["songs", sort],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongs<SongWithArtist>(lastPage, sort, ['artist'])
});

const librarySongsQuery = (
	slugOrId: string | number, sort: SortingParameters<typeof SongSortingKeys>
) => ({
	key: [
		"library",
		slugOrId,
		"songs",
		sort
	],
	exec: (lastPage: Page<SongWithArtist>) => API.getAllSongsInLibrary<SongWithArtist>(slugOrId, lastPage, sort, ['artist'])
});

export const getServerSideProps = prepareSSR((context) => {
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { librarySlug },
		infiniteQueries: [
			librarySlug
				? librarySongsQuery(librarySlug, { sortBy, order })
				: songsQuery({ sortBy, order })
		]
	};
});

const LibrarySongsPage = (
	{ librarySlug }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteSongView
		query={(sort) => librarySlug ? librarySongsQuery(librarySlug, sort) : songsQuery(sort)}
	/>;
};

export default LibrarySongsPage;
