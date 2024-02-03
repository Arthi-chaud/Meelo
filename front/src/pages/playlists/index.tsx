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

import InfinitePlaylistView from "../../components/infinite/infinite-resource-view/infinite-playlist-view";
import API from "../../api/api";
import { PlaylistSortingKeys } from "../../models/playlist";
import prepareSSR, { InferSSRProps } from "../../ssr";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import { getLayoutParams } from "../../utils/layout";

export const getServerSideProps = prepareSSR((context) => {
	const defaultLayout = getLayoutParams(context.query.view) ?? "list";
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		PlaylistSortingKeys,
	);

	return {
		additionalProps: { defaultLayout, order, sortBy },
		infiniteQueries: [API.getPlaylists({}, { sortBy, order })],
	};
});

const PlaylistsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	return (
		<InfinitePlaylistView
			initialSortingField={props.additionalProps?.sortBy}
			initialSortingOrder={props.additionalProps?.order}
			defaultLayout={props.additionalProps?.defaultLayout}
			query={({ view, library, ...sort }) => API.getPlaylists({}, sort)}
		/>
	);
};

export default PlaylistsPage;
