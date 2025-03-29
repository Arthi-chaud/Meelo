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
import API from "../../../api/api";
import { useQuery } from "../../../api/use-query";
import { Head } from "../../../components/head";
import InfiniteAlbumView from "../../../components/infinite/resource/album";
import ArtistRelationPageHeader from "../../../components/relation-page-header/resource/artist";
import type { GetPropsTypesFrom, Page } from "../../../ssr";
import { getYear } from "../../../utils/date";
import getSlugOrId from "../../../utils/getSlugOrId";
import { useGradientBackground } from "../../../utils/gradient-background";

const defaultSort = {
	sortBy: "releaseDate",
	order: "desc",
} as const;

const artistQuery = (artistIdentifier: string | number) =>
	API.getArtist(artistIdentifier, ["illustration"]);

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);

	return {
		additionalProps: {
			artistIdentifier,
		},
		queries: [artistQuery(artistIdentifier)],
		infiniteQueries: [
			API.getAlbums({ artist: artistIdentifier }, defaultSort, [
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
				title={artist.data && `${artist.data?.name} (${t("albums")})`}
			/>
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteAlbumView
				formatSubtitle={(album) =>
					getYear(album.releaseDate)?.toString() ?? ""
				}
				query={({ sortBy, order, libraries, types }) =>
					API.getAlbums(
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
