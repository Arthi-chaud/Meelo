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

import { Box, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getAlbums, getArtists, getGenre, getSongs } from "@/api/queries";
import { useQuery } from "~/api";
import { Head } from "~/components/head";
import InfiniteAlbumView from "~/components/infinite/resource/album";
import InfiniteArtistView from "~/components/infinite/resource/artist";
import { InfiniteSongView } from "~/components/infinite/resource/song";
import { useTabRouter } from "~/components/tab-router";
import getSlugOrId from "~/utils/getSlugOrId";

const prepareSSR = (context: NextPageContext) => {
	const genreIdentifier = getSlugOrId(context.query);
	const defaultQuerySortParams = { sortBy: "name", order: "asc" } as const;

	return {
		additionalProps: { genreIdentifier },
		queries: [getGenre(genreIdentifier)],
		infiniteQueries: [
			getAlbums({ genre: genreIdentifier }, defaultQuerySortParams, [
				"artist",
				"illustration",
			]),
			getArtists({ genre: genreIdentifier }, defaultQuerySortParams, [
				"illustration",
			]),
			getSongs({ genre: genreIdentifier }, defaultQuerySortParams, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
		],
	};
};

const tabs = ["artist", "album", "song"] as const;

const GenrePage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const { t } = useTranslation();
	const genreIdentifier = props?.genreIdentifier ?? getSlugOrId(router.query);
	const genre = useQuery(getGenre, genreIdentifier);
	const { selectedTab, selectTab } = useTabRouter(
		(r) => r.query.t,
		(newTab) => `/genres/${genreIdentifier}?t=${newTab}`,
		"album",
		"artist",
		"song",
	);

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
			<Tabs
				value={selectedTab}
				onChange={(__, tabName) => selectTab(tabName)}
				variant="fullWidth"
			>
				{tabs.map((value, index) => (
					<Tab
						key={index}
						value={value}
						sx={{ minWidth: "fit-content", flex: 1 }}
						label={t(`models.${value}_plural`)}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingBottom: 2 }} />
			{selectedTab === "artist" && (
				<InfiniteArtistView
					query={({ libraries, sortBy, order }) =>
						getArtists(
							{
								genre: genreIdentifier,
								library: libraries,
							},
							{ sortBy, order },
							["illustration"],
						)
					}
				/>
			)}
			{selectedTab === "album" && (
				<InfiniteAlbumView
					query={({ libraries, types, sortBy, order }) =>
						getAlbums(
							{
								genre: genreIdentifier,
								type: types,
								library: libraries,
							},
							{ sortBy, order },
							["artist", "illustration"],
						)
					}
				/>
			)}
			{selectedTab === "song" && (
				<InfiniteSongView
					query={({ libraries, types, random, sortBy, order }) =>
						getSongs(
							{
								genre: genreIdentifier,
								type: types,
								random,
								library: libraries,
							},
							{ sortBy, order },
							["artist", "featuring", "master", "illustration"],
						)
					}
				/>
			)}
		</Box>
	);
};

GenrePage.prepareSSR = prepareSSR;

export default GenrePage;
