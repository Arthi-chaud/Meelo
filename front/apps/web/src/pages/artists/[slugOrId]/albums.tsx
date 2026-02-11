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
import type { GetPropsTypesFrom, Page } from "ssr";
import { getAlbums, getArtist } from "@/api/queries";
import { AlbumSortingKeys } from "@/models/album";
import { getYear } from "@/utils/date";
import { useQuery } from "~/api";
import { useGradientBackground } from "~/components/gradient-background";
import { Head } from "~/components/head";
import { ssrGetSortingParameter } from "~/components/infinite/controls/sort";
import InfiniteAlbumView from "~/components/infinite/resource/album";
import ArtistRelationPageHeader from "~/components/relation-page-header/resource/artist";
import getSlugOrId from "~/utils/getSlugOrId";

const defaultSort = {
	sortBy: "releaseDate",
	order: "desc",
} as const;

const artistQuery = (artistIdentifier: string | number) =>
	getArtist(artistIdentifier, ["illustration"]);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);
	const sort = ssrGetSortingParameter(AlbumSortingKeys, context, defaultSort);

	return {
		additionalProps: {
			artistIdentifier,
		},
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			getAlbums({ artist: artistIdentifier }, sort, [
				"artist",
				"illustration",
			]),
		],
	};
};

const ArtistAlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
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
		<Box sx={{ width: "100%" }}>
			<GradientBackground />
			<Head
				title={
					artist.data &&
					`${artist.data?.name} (${t("models.album_plural")})`
				}
			/>
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteAlbumView
				formatSubtitle={(album) =>
					getYear(album.releaseDate)?.toString() ?? ""
				}
				query={({ sortBy, order, libraries, types }) =>
					getAlbums(
						{
							artist: artistIdentifier,
							type: types,
							library: libraries,
						},
						{ sortBy, order },
						["artist", "illustration"],
					)
				}
			/>
		</Box>
	);
};

ArtistAlbumsPage.prepareSSR = prepareSSR;

export default ArtistAlbumsPage;
