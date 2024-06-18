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
import { useRouter } from "next/router";
import API from "../../../api/api";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import { GetPropsTypesFrom, Page } from "../../../ssr";
import {
	prepareMeeloInfiniteQuery,
	useQuery,
	useQueryClient,
} from "../../../api/use-query";
import { SongSortingKeys } from "../../../models/song";
import { getOrderParams, getSortingFieldParams } from "../../../utils/sorting";
import Track from "../../../models/track";
import { NextPageContext } from "next";
import { QueryClient } from "react-query";
import { useGradientBackground } from "../../../utils/gradient-background";

const artistQuery = (identifier: string | number) =>
	API.getArtist(identifier, ["illustration"]);

const prepareSSR = async (
	context: NextPageContext,
	queryClient: QueryClient,
) => {
	const artistIdentifier = getSlugOrId(context.query);
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);
	const songs = await queryClient.fetchInfiniteQuery(
		prepareMeeloInfiniteQuery(() =>
			API.getSongs({ artist: artistIdentifier }, { sortBy, order }, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
		),
	);

	return {
		additionalProps: { artistIdentifier, sortBy, order },
		queries: [
			artistQuery(artistIdentifier),
			...songs.pages
				.flatMap(({ items }) => items)
				.map(({ master }) =>
					API.getRelease(master.releaseId, ["album"]),
				),
		],
		infiniteQueries: [],
	};
};

const ArtistSongPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const getTrackReleaseName = (track: Track) =>
		queryClient
			.fetchQuery(API.getRelease(track.releaseId))
			.then((release) => release.name);
	const artistIdentifier =
		props?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const { GradientBackground } = useGradientBackground(
		artist.data?.illustration?.colors,
	);

	return (
		<Box sx={{ width: "100%" }}>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteSongView
				initialSortingField={props?.sortBy ?? "name"}
				initialSortingOrder={props?.order ?? "asc"}
				query={({ library, sortBy, order, type, random }) =>
					API.getSongs(
						{
							artist: artistIdentifier,
							type,
							random,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["artist", "featuring", "master", "illustration"],
					)
				}
				formatSubtitle={(song) =>
					getTrackReleaseName(song.master).then((name) => name)
				}
			/>
		</Box>
	);
};

ArtistSongPage.prepareSSR = prepareSSR;

export default ArtistSongPage;
