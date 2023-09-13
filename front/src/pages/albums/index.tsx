import React from 'react';
import { useRouter } from 'next/router';
import API from '../../api/api';
import { AlbumSortingKeys } from '../../models/album';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import InfiniteAlbumView from '../../components/infinite/infinite-resource-view/infinite-album-view';
import prepareSSR, { InferSSRProps } from '../../ssr';
import { getLayoutParams } from '../../utils/layout';

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, AlbumSortingKeys);
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	const defaultLayout = getLayoutParams(context.query.view) ?? 'grid';

	return {
		additionalProps: { librarySlug, sortBy, order, defaultLayout },
		infiniteQueries: [
			librarySlug
				? API.getAllAlbumsInLibrary(librarySlug, undefined, { sortBy, order }, ["artist"])
				: API.getAllAlbums({ sortBy, order }, undefined, ["artist"])
		]
	};
});

const LibraryAlbumsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const librarySlug = props.additionalProps?.librarySlug ?? getLibrarySlug(router.asPath);

	return <InfiniteAlbumView
		initialSortingField={props.additionalProps?.sortBy}
		initialSortingOrder={props.additionalProps?.order}
		defaultLayout={props.additionalProps?.defaultLayout}
		query={(sort, type) => librarySlug
			? API.getAllAlbumsInLibrary(librarySlug, type, sort, ['artist'])
			: API.getAllAlbums(sort, type, ['artist'])
		}
	/>;
};

export default LibraryAlbumsPage;
