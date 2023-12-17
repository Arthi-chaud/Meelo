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
import { SongSortingKeys } from "../../models/song";
import API from "../../api/api";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import prepareSSR, { InferSSRProps } from "../../ssr";
import InfiniteSongView from "../../components/infinite/infinite-resource-view/infinite-song-view";

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { order, sortBy },
		infiniteQueries: [
			API.getSongs({}, { sortBy, order }, ["artist", "featuring"]),
		],
	};
});

const LibrarySongsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();

	return (
		<InfiniteSongView
			initialSortingField={props.additionalProps?.sortBy}
			initialSortingOrder={props.additionalProps?.order}
			query={({ sortBy, order, type, library }) =>
				API.getSongs(
					{ type, library: library ?? undefined },
					{ sortBy, order },
					["artist", "featuring"],
				)
			}
		/>
	);
};

export default LibrarySongsPage;
