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

import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { Head } from "../../components/head";
import InfinitePlaylistView from "../../components/infinite/infinite-resource-view/infinite-playlist-view";
import { PlaylistSortingKeys } from "../../models/playlist";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import { getLayoutParams } from "../../utils/layout";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";

const prepareSSR = (context: NextPageContext) => {
	const defaultLayout = getLayoutParams(context.query.view) ?? "list";
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		PlaylistSortingKeys,
	);

	return {
		additionalProps: { defaultLayout, order, sortBy },
		infiniteQueries: [
			API.getPlaylists({}, { sortBy, order }, ["illustration"]),
		],
	};
};

const PlaylistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const { t } = useTranslation();
	return (
		<>
			<Head title={t("playlists")} />
			<InfinitePlaylistView
				emptyState={{
					text: "emptyStatePlaylists",
				}}
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				defaultLayout={props?.defaultLayout}
				query={({ view, library, ...sort }) =>
					API.getPlaylists({}, sort, ["illustration"])
				}
			/>
		</>
	);
};

PlaylistsPage.prepareSSR = prepareSSR;

export default PlaylistsPage;
