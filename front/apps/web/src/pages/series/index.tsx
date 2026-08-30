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
import { getManySeries } from "@/api/queries";
import type { InfiniteQuery } from "@/api/query";
import type { IllustratedResource } from "@/models/illustration";
import type Series from "@/models/series";
import { SeriesSortingKeys } from "@/models/series";
import { Head } from "~/components/head";
import { Controls } from "~/components/infinite/controls/controls";
import {
	ssrGetSortingParameter,
	useSortControl,
} from "~/components/infinite/controls/sort";
import InfiniteList from "~/components/infinite/list";
import { SeriesItem } from "~/components/list-item/resource/series";

const prepareSSR = (context: NextPageContext) => {
	const sort = ssrGetSortingParameter(SeriesSortingKeys, context);
	return {
		infiniteQueries: [getManySeries(sort)],
	};
};

const SeriesPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();
	const [sort, sortControl] = useSortControl({
		sortingKeys: SeriesSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});

	return (
		<>
			<Head title={t("models.series_plural")} />
			<Controls sort={sortControl} />
			<InfiniteList
				render={(series) => <SeriesItem series={series} />}
				query={() =>
					getManySeries({
						sortBy: sort.sort,
						order: sort.order,
					}) as unknown as InfiniteQuery<Series & IllustratedResource>
				}
			/>
		</>
	);
};

SeriesPage.prepareSSR = prepareSSR;

export default SeriesPage;
