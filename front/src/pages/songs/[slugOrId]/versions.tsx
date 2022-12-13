import API from "../../../api/api";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteSongView from "../../../components/infinite/infinite-resource-view/infinite-song-view";
import { SongSortingKeys, SongWithArtist } from "../../../models/song";
import getSlugOrId from "../../../utils/getSlugOrId";
import { SortingParameters } from "../../../utils/sorting";
import { Box } from "@mui/material";
import SongRelationPageHeader from "../../../components/relation-page-header/song-relation-page-header";
import { useRouter } from "next/router";
import prepareSSR, { InferSSRProps } from "../../../ssr";

const songVersionsQuery = (
	songSlugOrId: number | string, sort?: SortingParameters<typeof SongSortingKeys>
) => ({
	key: [
		"song",
		songSlugOrId,
		"versions",
		sort ?? {}
	],
	exec: (lastPage: Page<SongWithArtist>) =>
		API.getSongVersions<SongWithArtist>(songSlugOrId, lastPage, sort, ['artist'])
});

export const getServerSideProps = prepareSSR((context) => {
	const songIdentifier = getSlugOrId(context.params);

	return {
		additionalProps: { songIdentifier },
		infiniteQueries: [songVersionsQuery(songIdentifier)]
	};
});

const SongVersionsPage = (
	{ songIdentifier }: InferSSRProps<typeof getServerSideProps>
) => {
	const router = useRouter();

	songIdentifier ??= getSlugOrId(router.query);
	return <Box sx={{ width: '100%' }}>
		<SongRelationPageHeader songSlugOrId={songIdentifier}/>
		<InfiniteSongView
			query={(sort) => songVersionsQuery(songIdentifier, sort)}
		/>
	</Box>;
};

export default SongVersionsPage;
