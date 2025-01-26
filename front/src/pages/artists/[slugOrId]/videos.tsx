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

import { useRouter } from "next/router";
import API from "../../../api/api";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import type { GetPropsTypesFrom, Page } from "../../../ssr";
import InfiniteVideoView from "../../../components/infinite/infinite-resource-view/infinite-video-view";
import { VideoSortingKeys } from "../../../models/video";
import { getOrderParams, getSortingFieldParams } from "../../../utils/sorting";
import { useQuery } from "../../../api/use-query";
import type { NextPageContext } from "next";
import { useGradientBackground } from "../../../utils/gradient-background";
import { Head } from "../../../components/head";
import { useTranslation } from "react-i18next";

const artistQuery = (identifier: string | number) =>
	API.getArtist(identifier, ["illustration"]);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		VideoSortingKeys,
	);

	return {
		additionalProps: { artistIdentifier, order, sortBy },
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			API.getVideos(
				{ artist: artistIdentifier },
				{ sortBy: sortBy, order: order },
				["artist", "master", "illustration"],
			),
		],
	};
};

const ArtistSongPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const router = useRouter();
	const artistIdentifier =
		props?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(artistQuery, artistIdentifier);
	const { GradientBackground } = useGradientBackground(
		artist.data?.illustration?.colors,
	);
	const { t } = useTranslation();

	return (
		<>
			<Head
				title={artist.data && `${artist.data?.name} (${t("videos")})`}
			/>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteVideoView
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				query={({ sortBy, order, library, random, type }) =>
					API.getVideos(
						{
							type,
							artist: artistIdentifier,
							random,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["artist", "master", "illustration"],
					)
				}
				subtitle="duration"
			/>
		</>
	);
};

ArtistSongPage.prepareSSR = prepareSSR;

export default ArtistSongPage;
