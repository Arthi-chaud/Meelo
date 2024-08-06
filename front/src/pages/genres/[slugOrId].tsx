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

import { Box, Skeleton, Typography } from "@mui/material";
import { useRouter } from "next/router";
import SelectableInfiniteView from "../../components/infinite/selectable-infinite-view";
import { useQuery } from "../../api/use-query";
import getSlugOrId from "../../utils/getSlugOrId";
import { GetPropsTypesFrom, Page } from "../../ssr";
import API from "../../api/api";
import { NextPageContext } from "next";
import { Head } from "../../components/head";

const prepareSSR = (context: NextPageContext) => {
	const genreIdentifier = getSlugOrId(context.query);
	const defaultQuerySortParams = { sortBy: "name", order: "asc" } as const;

	return {
		additionalProps: { genreIdentifier },
		queries: [API.getGenre(genreIdentifier)],
		infiniteQueries: [
			API.getAlbums({ genre: genreIdentifier }, defaultQuerySortParams, [
				"artist",
				"illustration",
			]),
			API.getArtists({ genre: genreIdentifier }, defaultQuerySortParams, [
				"illustration",
			]),
			API.getSongs({ genre: genreIdentifier }, defaultQuerySortParams, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
		],
	};
};

const GenrePage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const genreIdentifier = props?.genreIdentifier ?? getSlugOrId(router.query);
	const genre = useQuery(API.getGenre, genreIdentifier);

	return (
		<Box sx={{ width: "100%" }}>
			<Head title={genre.data?.name} />
			<Box
				sx={{
					width: "100%",
					justifyContent: "center",
					textAlign: "center",
					display: "flex",
					marginY: 5,
				}}
			>
				<Typography variant="h5" sx={{ fontWeight: "bold" }}>
					{genre.data?.name ?? <Skeleton width={"100px"} />}
				</Typography>
			</Box>
			<SelectableInfiniteView
				enabled={true}
				artistQuery={({ library }, { sortBy, order }) =>
					API.getArtists(
						{
							genre: genreIdentifier,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["illustration"],
					)
				}
				albumQuery={({ library, type }, { sortBy, order }) =>
					API.getAlbums(
						{
							genre: genreIdentifier,
							type,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["artist", "illustration"],
					)
				}
				songQuery={({ library, type, random }, { sortBy, order }) =>
					API.getSongs(
						{
							genre: genreIdentifier,
							type,
							random,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["artist", "featuring", "master", "illustration"],
					)
				}
			/>
		</Box>
	);
};

GenrePage.prepareSSR = prepareSSR;

export default GenrePage;
