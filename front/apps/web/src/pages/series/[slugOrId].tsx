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

import { Box, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getAlbums, getOneSeries, getSongs } from "@/api/queries";
import {
	infiniteSongQueryToPlayerQuery,
	playFromInfiniteQuery,
} from "@/state/player";
import { RadioIcon } from "@/ui/icons";
import { getRandomNumber } from "@/utils/random";
import { useQuery, useQueryClient } from "~/api";
import { Head } from "~/components/head";
import InfiniteAlbumView from "~/components/infinite/resource/album";
import getSlugOrId from "~/utils/getSlugOrId";

const prepareSSR = (context: NextPageContext) => {
	const seriesIdentifier = getSlugOrId(context.query);
	const defaultQuerySortParams = {
		sortBy: "seriesIndex",
		order: "asc",
	} as const;

	return {
		additionalProps: { seriesIdentifier },
		queries: [getOneSeries(seriesIdentifier)],
		infiniteQueries: [
			getAlbums({ series: seriesIdentifier }, defaultQuerySortParams, [
				"artists",
				"illustration",
			]),
		],
	};
};

const SeriesPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const playFromQuery = useSetAtom(playFromInfiniteQuery);
	const seriesIdentifier =
		props?.seriesIdentifier ?? getSlugOrId(router.query);
	const series = useQuery(getOneSeries, seriesIdentifier);

	const playRadio = () => {
		playFromQuery(
			infiniteSongQueryToPlayerQuery(
				getSongs(
					{ series: seriesIdentifier, random: getRandomNumber() },
					undefined,
					["artist", "featuring", "master", "illustration"],
				),
			),
			queryClient,
		);
	};

	return (
		<>
			<Head title={series.data?.name} />
			<Box
				sx={{
					width: "100%",
					display: "flex",
					alignItems: "center",
					flexDirection: "column",
					marginY: 5,
					gap: 0.5,
				}}
			>
				<Stack
					direction={"row"}
					sx={{
						justifyContent: "center",
						gap: 1,
						alignItems: "center",
						textAlign: "center",
					}}
				>
					<IconButton onClick={playRadio}>
						<RadioIcon />
					</IconButton>
					<Typography
						variant="h5"
						sx={{
							fontWeight: "bold",
							paddingRight: 1, // To balance with button padding
						}}
					>
						{series.data?.name ?? <Skeleton width={"100px"} />}
					</Typography>
				</Stack>
			</Box>
			<InfiniteAlbumView
				query={({ sortBy, order }) =>
					getAlbums({ series: seriesIdentifier }, { sortBy, order }, [
						"artists",
						"illustration",
					])
				}
			/>
		</>
	);
};

SeriesPage.prepareSSR = prepareSSR;

export default SeriesPage;
