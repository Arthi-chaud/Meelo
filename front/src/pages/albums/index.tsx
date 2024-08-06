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
import { GetPropsTypesFrom, Page } from "../../ssr";
import { getLayoutParams } from "../../utils/layout";
import { getAlbumTypeParam } from "../../utils/album-type";
import { NextPageContext } from "next";
import { Head } from "../../components/head";
import { useTranslation } from "react-i18next";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		AlbumSortingKeys,
	);
	const type = getAlbumTypeParam(context.query.type);
	const defaultLayout = getLayoutParams(context.query.view) ?? "grid";

	return {
		additionalProps: { sortBy, order, defaultLayout, type: type ?? null },
		infiniteQueries: [
			API.getAlbums({ type: type ?? undefined }, { sortBy, order }, [
				"artist",
				"illustration",
			]),
		],
	};
};

const LibraryAlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const router = useRouter();
	const defaultType = props?.type ?? null;
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("albums")} />
			<InfiniteAlbumView
				defaultAlbumType={defaultType}
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				defaultLayout={props?.defaultLayout}
				query={({ sortBy, order, type, library }) =>
					API.getAlbums(
						{ type, library: library ?? undefined },
						{ sortBy, order },
						["artist", "illustration"],
					)
				}
			/>
		</>
	);
};

LibraryAlbumsPage.prepareSSR = prepareSSR;

export default LibraryAlbumsPage;
