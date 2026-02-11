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

import { Box } from "@mui/material";
import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getGenres } from "@/api/queries";
import type { InfiniteQuery } from "@/api/query";
import type Genre from "@/models/genre";
import { GenreSortingKeys } from "@/models/genre";
import type { IllustratedResource } from "@/models/illustration";
import { Head } from "~/components/head";
import { Controls } from "~/components/infinite/controls/controls";
import {
	ssrGetSortingParameter,
	useSortControl,
} from "~/components/infinite/controls/sort";
import InfiniteGrid from "~/components/infinite/grid";
import { GenreTile } from "~/components/tile/resource/genre";

const prepareSSR = (context: NextPageContext) => {
	const sort = ssrGetSortingParameter(GenreSortingKeys, context);

	return {
		infiniteQueries: [getGenres({}, sort)],
	};
};

const GenresPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	const [sort, sortControl] = useSortControl({
		sortingKeys: GenreSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	return (
		<>
			<Head title={t("models.genre_plural")} />
			<Controls sort={sortControl} />
			<InfiniteGrid
				itemSize={"xl"}
				render={(genre) => (
					<Box sx={{ padding: 3 }}>
						<GenreTile genre={genre} />
					</Box>
				)}
				query={() =>
					getGenres(
						{},
						{ sortBy: sort.sort, order: sort.order },
					) as unknown as InfiniteQuery<Genre & IllustratedResource>
				}
			/>
		</>
	);
};

GenresPage.prepareSSR = prepareSSR;

export default GenresPage;
