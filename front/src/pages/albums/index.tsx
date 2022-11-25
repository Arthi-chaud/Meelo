import React from 'react';
import { useRouter } from 'next/router';
import API from '../../api/api';
import Album, {
	AlbumSortingKeys, AlbumType, AlbumWithArtist
} from '../../models/album';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { Page } from '../../components/infinite/infinite-scroll';
import {
	SortingParameters, getOrderParams, getSortingFieldParams
} from '../../utils/sorting';
import InfiniteAlbumView from '../../components/infinite/infinite-album-view';
import prepareSSR, { InferSSRProps } from '../../ssr';

const albumsQuery = (sort: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) => ({
	key: [
		"albums",
		sort,
		type ?? {}
	],
	exec: (lastPage: Page<Album>) => API.getAllAlbums<AlbumWithArtist>(lastPage, sort, type, ["artist"])
});

const libraryAlbumsQuery = (
	slugOrId: string | number,
	sort: SortingParameters<typeof AlbumSortingKeys>,
	type?: AlbumType
) => ({
	key: [
		"library",
		slugOrId,
		"albums",
		sort,
		type ?? {}
	],
	exec: (lastPage: Page<Album>) => API.getAllAlbumsInLibrary<AlbumWithArtist>(
		slugOrId, lastPage, type, sort, ["artist"]
	)
});

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, AlbumSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;

	return {
		additionalProps: { librarySlug },
		infiniteQueries: [
			librarySlug
				? libraryAlbumsQuery(librarySlug, { sortBy, order })
				: albumsQuery({ sortBy, order })
		]
	};
});

const LibraryAlbumsPage = (
	{ librarySlug }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteAlbumView
		initialSortingField={getSortingFieldParams(router.query.sortBy, AlbumSortingKeys)}
		initialSortingOrder={getOrderParams(router.query.order)}
		initialView={(router.query.view == 'list' ? 'list' : 'grid')}
		query={(sort, type) => librarySlug
			? libraryAlbumsQuery(librarySlug, sort, type)
			: albumsQuery(sort, type)
		}
	/>;
};

export default LibraryAlbumsPage;
