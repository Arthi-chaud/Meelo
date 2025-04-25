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
import type { GetPropsTypesFrom, Page } from "ssr";
import { getPlaylists } from "~/api/queries";
import { Head } from "~/components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "~/components/infinite/controls/sort";
import InfinitePlaylistView from "~/components/infinite/resource/playlist";
import { PlaylistSortingKeys } from "~/models/playlist";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, PlaylistSortingKeys);

	return {
		infiniteQueries: [
			getPlaylists({}, { sortBy, order }, ["illustration"]),
		],
	};
};

const PlaylistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();
	return (
		<>
			<Head title={t("playlists")} />
			<InfinitePlaylistView
				emptyState={{
					text: "emptyStatePlaylists",
				}}
				query={(sort) => getPlaylists({}, sort, ["illustration"])}
			/>
		</>
	);
};

PlaylistsPage.prepareSSR = prepareSSR;

export default PlaylistsPage;
