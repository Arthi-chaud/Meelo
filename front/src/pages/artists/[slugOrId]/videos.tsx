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
import prepareSSR, { InferSSRProps } from "../../../ssr";
import InfiniteVideoView from "../../../components/infinite/infinite-resource-view/infinite-video-view";
import formatDuration from "../../../utils/formatDuration";
import { SongSortingKeys } from "../../../models/song";
import { getOrderParams, getSortingFieldParams } from "../../../utils/sorting";
import { useQuery } from "../../../api/use-query";
import GradientBackground from "../../../components/gradient-background";

export const getServerSideProps = prepareSSR((context) => {
	const artistIdentifier = getSlugOrId(context.params);
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { artistIdentifier, order, sortBy },
		queries: [API.getArtist(artistIdentifier)],
		infiniteQueries: [
			API.getVideos(
				{ artist: artistIdentifier },
				{ sortBy: "name", order: "asc" },
				["artist", "featuring"],
			),
		],
	};
});

const ArtistSongPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const artistIdentifier =
		props.additionalProps?.artistIdentifier ?? getSlugOrId(router.query);
	const artist = useQuery(API.getArtist, artistIdentifier);

	return (
		<>
			<GradientBackground colors={artist.data?.illustration?.colors} />
			<ArtistRelationPageHeader artist={artist.data} />
			<InfiniteVideoView
				initialSortingField={props.additionalProps?.sortBy}
				initialSortingOrder={props.additionalProps?.order}
				query={(sort) =>
					API.getVideos({ artist: artistIdentifier }, sort, [
						"artist",
						"featuring",
					])
				}
				formatSubtitle={(song) => formatDuration(song.track.duration)}
			/>
		</>
	);
};

export default ArtistSongPage;
