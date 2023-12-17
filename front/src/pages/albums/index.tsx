/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import { useRouter } from "next/router";
import API from "../../api/api";
import { AlbumSortingKeys } from "../../models/album";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import InfiniteAlbumView from "../../components/infinite/infinite-resource-view/infinite-album-view";
import prepareSSR, { InferSSRProps } from "../../ssr";
import { getLayoutParams } from "../../utils/layout";

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		AlbumSortingKeys,
	);
	const defaultLayout = getLayoutParams(context.query.view) ?? "grid";

	return {
		additionalProps: { sortBy, order, defaultLayout },
		infiniteQueries: [API.getAlbums({}, { sortBy, order }, ["artist"])],
	};
});

const LibraryAlbumsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();

	return (
		<InfiniteAlbumView
			initialSortingField={props.additionalProps?.sortBy}
			initialSortingOrder={props.additionalProps?.order}
			defaultLayout={props.additionalProps?.defaultLayout}
			query={({ sortBy, order, type, library }) =>
				API.getAlbums(
					{ type, library: library ?? undefined },
					{ sortBy, order },
					["artist"],
				)
			}
		/>
	);
};

export default LibraryAlbumsPage;
