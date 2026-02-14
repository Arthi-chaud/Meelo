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
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getArtist, getVideos } from "@/api/queries";
import { VideoSortingKeys } from "@/models/video";
import { useQuery } from "~/api";
import { useGradientBackground } from "~/components/gradient-background";
import { Head } from "~/components/head";
import { ssrGetSortingParameter } from "~/components/infinite/controls/sort";
import InfiniteVideoView from "~/components/infinite/resource/video";
import ArtistRelationPageHeader from "~/components/relation-page-header/resource/artist";
import getSlugOrId from "~/utils/getSlugOrId";

const artistQuery = (identifier: string | number) =>
	getArtist(identifier, ["illustration"]);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);
	const sort = ssrGetSortingParameter(VideoSortingKeys, context);

	return {
		additionalProps: { artistIdentifier },
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			getVideos({ artist: artistIdentifier }, sort, [
				"artist",
				"master",
				"illustration",
			]),
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
				title={
					artist.data &&
					`${artist.data?.name} (${t("models.video_plural")})`
				}
			/>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteVideoView
				query={({ sortBy, order, libraries, random, types }) =>
					getVideos(
						{
							type: types,
							artist: artistIdentifier,
							random,
							library: libraries,
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
