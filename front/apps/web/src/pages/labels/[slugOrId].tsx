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

import {
	Box,
	IconButton,
	Link as MUILink,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";
import { useSetAtom } from "jotai";
import type { NextPageContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import type { GetPropsTypesFrom, Page } from "ssr";
import {
	getAlbums,
	getArea,
	getArtists,
	getLabel,
	getSongs,
} from "@/api/queries";
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
	const labelIdentifier = getSlugOrId(context.query);
	const defaultQuerySortParams = { sortBy: "name", order: "asc" } as const;

	return {
		additionalProps: { labelIdentifier },
		queries: [getLabel(labelIdentifier)],
		infiniteQueries: [
			getAlbums({ label: labelIdentifier }, defaultQuerySortParams, [
				"artists",
				"illustration",
			]),
			getArtists({ label: labelIdentifier }, defaultQuerySortParams, [
				"illustration",
			]),
		],
	};
};

const tabs = ["artist", "album", "song"] as const;

const LabelPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const playFromQuery = useSetAtom(playFromInfiniteQuery);
	const labelIdentifier = props?.labelIdentifier ?? getSlugOrId(router.query);
	const label = useQuery(getLabel, labelIdentifier);
	const { data: area } = useQuery(getArea, label.data?.areaId ?? undefined);

	const playRadio = () => {
		playFromQuery(
			infiniteSongQueryToPlayerQuery(
				getSongs(
					{ label: labelIdentifier, random: getRandomNumber() },
					undefined,
					["artist", "featuring", "master", "illustration"],
				),
			),
			queryClient,
		);
	};
	const formattedDate = useMemo(() => {
		if (!label.data?.startDate) {
			return null;
		}
		const startDate = new Date(label.data.startDate)
			.getFullYear()
			.toString();

		const endDate = label.data.endDate
			? new Date(label.data.endDate).getFullYear().toString()
			: "Present";
		return `${startDate} - ${endDate}`;
	}, [label.data?.startDate, label.data?.endDate]);

	return (
		<TabPage
			tabs={tabs}
			urlFromTab={(tab) => `/labels/${labelIdentifier}?t=${tab}`}
			translateTab={(tab) => `models.${tab}_plural`}
			header={
				<>
					<Head title={label.data?.name} />
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
								{label.data?.name ?? (
									<Skeleton width={"100px"} />
								)}
							</Typography>
						</Stack>

						<Stack direction={"row"}>
							{formattedDate && (
								<Typography
									sx={{ fontSize: "small" }}
									color="textSecondary"
								>
									{formattedDate}
								</Typography>
							)}
						</Stack>
						<Stack direction={"row"}>
							{area && (
								<Typography
									sx={{ fontSize: "small" }}
									color="textSecondary"
								>
									{"Based in "}
									<MUILink
										href={`/areas/${area.id}`}
										underline="hover"
										sx={{ color: "text.secondary" }}
										component={Link}
									>
										{area?.name}
									</MUILink>
								</Typography>
							)}
						</Stack>
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
											label: labelIdentifier,
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
											label: labelIdentifier,
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
											label: labelIdentifier,
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

LabelPage.prepareSSR = prepareSSR;

export default LabelPage;
