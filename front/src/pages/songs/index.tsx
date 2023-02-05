import React from 'react';
import { useRouter } from 'next/router';
import { SongSortingKeys } from '../../models/song';
import API from '../../api/api';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import InfiniteSongView from '../../components/infinite/infinite-resource-view/infinite-song-view';

export const getServerSideProps = prepareSSR((context) => {
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { librarySlug },
		infiniteQueries: [
			librarySlug
				? API.getAllSongsInLibrary(librarySlug, { sortBy, order }, ['artist'])
				: API.getAllSongs({ sortBy, order }, ['artist'])
		]
	};
});

const LibrarySongsPage = (
	{ librarySlug }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteSongView
		query={(sort) => librarySlug
			? API.getAllSongsInLibrary(librarySlug, sort, ['artist'])
			: API.getAllSongs(sort, ['artist'])
		}
	/>;
};

export default LibrarySongsPage;
