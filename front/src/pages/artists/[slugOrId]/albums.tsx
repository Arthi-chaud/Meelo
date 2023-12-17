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
import prepareSSR, { InferSSRProps } from "../../../ssr";
import getYear from "../../../utils/getYear";
import { getLayoutParams } from "../../../utils/layout";
import { useQuery } from "../../../api/use-query";
import BackgroundBlurhash from "../../../components/blurhash-background";

const defaultSort = {
	sortBy: "releaseDate",
	order: "desc",
} as const;

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);
	const defaultLayout = getLayoutParams(context.query.view) ?? "grid";

	return {
		additionalProps: { artistIdentifier, defaultLayout },
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [
			API.getAlbums({ artist: artistIdentifier }, defaultSort, [
				"artist",
			]),
		],
	};
});

const ArtistAlbumsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const artist = useQuery(
		API.getArtist,
		props.additionalProps?.artistIdentifier,
	);
	const artistIdentifier =
		props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);

	return (
		<Box sx={{ width: "100%" }}>
			<BackgroundBlurhash
				blurhash={artist.data?.illustration?.blurhash}
			/>
			<ArtistRelationPageHeader artistSlugOrId={artistIdentifier} />
			<InfiniteAlbumView
				defaultLayout={props.additionalProps?.defaultLayout}
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

export default ArtistAlbumsPage;
