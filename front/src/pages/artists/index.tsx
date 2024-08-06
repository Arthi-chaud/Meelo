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
import API from "../../api/api";
import { ArtistSortingKeys } from "../../models/artist";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import { GetPropsTypesFrom, Page } from "../../ssr";
import { useRouter } from "next/router";
import InfiniteArtistView from "../../components/infinite/infinite-resource-view/infinite-artist-view";
import { getLayoutParams } from "../../utils/layout";
import { NextPageContext } from "next";
import { Head } from "../../components/head";
import { useTranslation } from "react-i18next";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		ArtistSortingKeys,
	);
	const defaultLayout = getLayoutParams(context.query.view) ?? "list";

	return {
		additionalProps: { defaultLayout, sortBy, order },
		infiniteQueries: [
			API.getArtists({}, { sortBy, order }, ["illustration"]),
		],
	};
};

const ArtistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("artists")} />
			<InfiniteArtistView
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				defaultLayout={props?.defaultLayout}
				query={({ library, sortBy, order }) =>
					API.getArtists(
						library ? { library } : {},
						{ sortBy, order },
						["illustration"],
					)
				}
			/>
		</>
	);
};

ArtistsPage.prepareSSR = prepareSSR;

export default ArtistsPage;
