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

import { Box, IconButton, Skeleton, Typography } from "@mui/material";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getAlbums, getArtists, getGenre, getSongs } from "@/api/queries";
import {
	infiniteSongQueryToPlayerQuery,
	playFromInfiniteQuery,
} from "@/state/player";
import { RadioIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import { useQuery, useQueryClient } from "~/api";
import { Head } from "~/components/head";
import InfiniteAlbumView from "~/components/infinite/resource/album";
import InfiniteArtistView from "~/components/infinite/resource/artist";
import { InfiniteSongView } from "~/components/infinite/resource/song";
import { TabPage } from "~/components/tab-page";
import getSlugOrId from "~/utils/getSlugOrId";

const prepareSSR = (context: NextPageContext) => {
	const genreIdentifier = getSlugOrId(context.query);
	const defaultQuerySortParams = { sortBy: "name", order: "asc" } as const;

	return {
		additionalProps: { genreIdentifier },
		queries: [getGenre(genreIdentifier)],
		infiniteQueries: [
			getAlbums({ genre: genreIdentifier }, defaultQuerySortParams, [
				"artists",
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
	const genreIdentifier = props?.genreIdentifier ?? getSlugOrId(router.query);
	const genre = useQuery(getGenre, genreIdentifier);
	const playFromQuery = useSetAtom(playFromInfiniteQuery);
	const queryClient = useQueryClient();
	const playRadio = () => {
		playFromQuery(
			infiniteSongQueryToPlayerQuery(
				getSongs(
					{ genre: genreIdentifier, random: getRandomNumber() },
					undefined,
					["artist", "featuring", "master", "illustration"],
				),
			),
			queryClient,
		);
	};

	return (
		<TabPage
			tabs={tabs}
			urlFromTab={(newTab) => `/genres/${genreIdentifier}?t=${newTab}`}
			translateTab={(tab) => `models.${tab}_plural`}
			header={
				<>
					<Head title={genre.data?.name} />
					<Box
						sx={{
							width: "100%",
							gap: 1,
							justifyContent: "center",
							alignItems: "center",
							textAlign: "center",
							display: "flex",
							marginY: 5,
						}}
					>
						<IconButton onClick={playRadio}>
							<RadioIcon />
						</IconButton>
						<Typography variant="h5" sx={{ fontWeight: "bold" }}>
							{genre.data?.name ?? <Skeleton width={"100px"} />}
						</Typography>
					</Box>
				</>
			}
			render={(tab) => {
				switch (tab) {
					case "artist":
						return (
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
						);
					case "album":
						return (
							<InfiniteAlbumView
								query={({ libraries, types, sortBy, order }) =>
									getAlbums(
										{
											genre: genreIdentifier,
											type: types,
											library: libraries,
										},
										{ sortBy, order },
										["artists", "illustration"],
									)
								}
							/>
						);
					case "song":
						return (
							<InfiniteSongView
								query={({
									libraries,
									types,
									random,
									sortBy,
									order,
								}) =>
									getSongs(
										{
											genre: genreIdentifier,
											type: types,
											random,
											library: libraries,
										},
										{ sortBy, order },
										[
											"artist",
											"featuring",
											"master",
											"illustration",
										],
									)
								}
							/>
						);
				}
			}}
		/>
	);
};

GenrePage.prepareSSR = prepareSSR;

export default GenrePage;
