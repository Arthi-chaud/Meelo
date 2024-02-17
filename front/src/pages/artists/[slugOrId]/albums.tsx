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
import InfiniteAlbumView from "../../../components/infinite/infinite-resource-view/infinite-album-view";
import getSlugOrId from "../../../utils/getSlugOrId";
import ArtistRelationPageHeader from "../../../components/relation-page-header/artist-relation-page-header";
import { GetPropsTypesFrom, Page } from "../../../ssr";
import getYear from "../../../utils/getYear";
import { getLayoutParams } from "../../../utils/layout";
import { useQuery } from "../../../api/use-query";
import { getAlbumTypeParam } from "../../../utils/album-type";
import { NextPageContext } from "next";
import { useGradientBackground } from "../../../utils/gradient-background";

const defaultSort = {
	sortBy: "releaseDate",
	order: "desc",
} as const;

const prepareSSR = (context: NextPageContext) => {
	const artistIdentifier = getSlugOrId(context.query);
	const defaultLayout = getLayoutParams(context.query.view) ?? "grid";
	const type = getAlbumTypeParam(context.query.type);

	return {
		additionalProps: {
			artistIdentifier,
			defaultLayout,
			type: type ?? null,
		},
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [
			API.getAlbums(
				{ artist: artistIdentifier, type: type },
				defaultSort,
				["artist"],
			),
		],
	};
};

const ArtistAlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const router = useRouter();
	const artistIdentifier =
		props?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(API.getArtist, artistIdentifier);
	const defaultType = props?.type ?? null;
	const { GradientBackground } = useGradientBackground(
		artist.data?.illustration?.colors,
	);

	return (
		<Box sx={{ width: "100%" }}>
			<GradientBackground />
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteAlbumView
				defaultLayout={props?.defaultLayout}
				defaultAlbumType={defaultType}
				initialSortingField={defaultSort.sortBy}
				initialSortingOrder={defaultSort.order}
				formatSubtitle={(album) =>
					getYear(album.releaseDate)?.toString() ?? ""
				}
				query={({ sortBy, order, library, type }) =>
					API.getAlbums(
						{
							artist: artistIdentifier,
							type,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["artist"],
					)
				}
			/>
		</Box>
	);
};

ArtistAlbumsPage.prepareSSR = prepareSSR;

export default ArtistAlbumsPage;
