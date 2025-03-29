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
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { QueryClient } from "react-query";
import API from "api/api";
import {
	prepareMeeloInfiniteQuery,
	useQuery,
	useQueryClient,
} from "api/use-query";
import { Head } from "components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "components/infinite/controls/sort";
import { HybridInfiniteSongView } from "components/infinite/resource/song";
import ArtistRelationPageHeader from "components/relation-page-header/resource/artist";
import { SongSortingKeys } from "models/song";
import type Track from "models/track";
import type { GetPropsTypesFrom, Page } from "ssr";
import getSlugOrId from "utils/getSlugOrId";
import { useGradientBackground } from "utils/gradient-background";

const artistQuery = (identifier: string | number) =>
	API.getArtist(identifier, ["illustration"]);

const isRareSongsPage = ({ asPath }: { asPath?: string }) =>
	asPath?.includes("/rare-songs") ?? false;

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const artistIdentifier = getSlugOrId(context.query);
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, SongSortingKeys);
	const songs = await queryClient.fetchInfiniteQuery(
		prepareMeeloInfiniteQuery(() =>
			API.getSongs(
				{
					[isRareSongsPage(context) ? "rare" : "artist"]:
						artistIdentifier,
				},
				{ sortBy, order },
				["artist", "featuring", "master", "illustration"],
			),
		),
	);

	return {
		additionalProps: { artistIdentifier, sortBy, order },
		queries: [
			artistQuery(artistIdentifier),
			...songs.pages
				.flatMap(({ items }) => items)
				.filter(({ master }) => master.releaseId)
				.map(({ master }) =>
					API.getRelease(master.releaseId!, ["album"]),
				),
		],
		infiniteQueries: [],
	};
};

const ArtistSongPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const router = useRouter();
	const isRareSongs = isRareSongsPage(router);
	const queryClient = useQueryClient();
	const getTrackReleaseName = (track: Track): Promise<string | null> =>
		track.releaseId
			? queryClient
					.fetchQuery(API.getRelease(track.releaseId))
					.then((release) => release.name)
			: Promise.resolve(null);
	const artistIdentifier =
		props?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const { GradientBackground } = useGradientBackground(
		artist.data?.illustration?.colors,
	);
	const { t } = useTranslation();

	return (
		<Box sx={{ width: "100%" }}>
			<Head
				title={
					artist.data &&
					`${artist.data?.name} (${t(
						isRareSongs ? "rareSongs" : "songs",
					)})`
				}
			/>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<HybridInfiniteSongView
				song={{
					query: ({ libraries, sortBy, order, types, random }) =>
						API.getSongs(
							{
								[isRareSongsPage(router) ? "rare" : "artist"]:
									artistIdentifier,
								type: types,
								random,
								library: libraries,
							},
							{ sortBy, order },
							["artist", "featuring", "master", "illustration"],
						),

					subtitles: [(song) => getTrackReleaseName(song.master)],
				}}
				songGroup={
					isRareSongsPage(router)
						? undefined
						: {
								query: ({ libraries, type }) =>
									API.getSongGroups(
										{
											type: type,
											artist: artistIdentifier,
											library: libraries,
										},
										undefined,
										[
											"artist",
											"featuring",
											"master",
											"illustration",
										],
									),

								subtitles: [
									(song) => getTrackReleaseName(song.master),
								],
							}
				}
			/>
		</Box>
	);
};

ArtistSongPage.prepareSSR = prepareSSR;

export default ArtistSongPage;
