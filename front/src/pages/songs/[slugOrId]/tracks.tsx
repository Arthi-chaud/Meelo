import { Box } from "@mui/material";
import { useRouter } from "next/router";
import API from "../../../api/api";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteTrackView from "../../../components/infinite/infinite-resource-view/infinite-track-view";
import Track, {
	TrackSortingKeys, TrackWithRelease, TrackWithSong
} from "../../../models/track";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import prepareSSR, { InferSSRProps } from "../../../ssr";

const songTracksQuery = (
	songSlugOrId: number | string, sort?: SortingParameters<typeof TrackSortingKeys>
) => ({
	key: [
		"song",
		songSlugOrId,
		"tracks",
		sort ?? {}
	],
	exec: (lastPage: Page<Track>) =>
		API.getSongTracks<TrackWithRelease & TrackWithSong>(songSlugOrId, lastPage, sort, ["release", "song"])
});

export const getServerSideProps = prepareSSR((context) => {
	const songIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { songIdentifier },
		infiniteQueries: [songTracksQuery(songIdentifier)]
	};
});

const SongTracksPage = (
	{ songIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	songIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<SongRelationPageHeader songSlugOrId={songIdentifier}/>
		<InfiniteTrackView
			query={(sort) => songTracksQuery(songIdentifier, sort)}
		/>
	</Box>;
};

export default SongTracksPage;
