import React from 'react';
import { useRouter } from 'next/router';
import { SongSortingKeys } from '../../models/song';
import API from '../../api/api';
import getLibrarySlug from '../../utils/getLibrarySlug';
import { getOrderParams, getSortingFieldParams } from '../../utils/sorting';
import prepareSSR, { InferSSRProps } from '../../ssr';
import InfiniteVideoView from '../../components/infinite/infinite-resource-view/infinite-video-view';

export const getServerSideProps = prepareSSR((context) => {
	const librarySlug = getLibrarySlug(context.req.url!) ?? null;
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { librarySlug },
		infiniteQueries: [
			librarySlug
				? API.getAllVideosInLibrary(librarySlug, { sortBy, order }, ['artist'])
				: API.getAllVideos({ sortBy, order }, ['artist'])
		]
	};
});

const LibraryVideosPage = (
	{ librarySlug }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	librarySlug ??= getLibrarySlug(router.asPath);
	return <InfiniteVideoView
		query={(sort) => librarySlug
			? API.getAllVideosInLibrary(librarySlug, sort, ['artist'])
			: API.getAllVideos(sort, ['artist'])
		}
		formatSubtitle={(video) => video.artist.name}
	/>;
};

export default LibraryVideosPage;
