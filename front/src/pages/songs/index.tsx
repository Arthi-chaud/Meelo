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
		additionalProps: { librarySlug, order, sortBy },
		infiniteQueries: [
			librarySlug
				? API.getAllSongsInLibrary(librarySlug, { sortBy, order }, undefined, ['artist'])
				: API.getAllSongs({ sortBy, order }, undefined, ['artist'])
		]
	};
});

const LibrarySongsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const librarySlug = props.additionalProps?.librarySlug ?? getLibrarySlug(router.asPath);

	return <InfiniteSongView
		initialSortingField={props.additionalProps?.sortBy}
		initialSortingOrder={props.additionalProps?.order}
		query={(sort, type) => librarySlug
			? API.getAllSongsInLibrary(librarySlug, sort, type, ['artist'])
			: API.getAllSongs(sort, type, ['artist'])
		}
	/>;
};

export default LibrarySongsPage;
