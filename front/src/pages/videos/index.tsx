import API from "api/api";
import { Head } from "components/head";
import { getOrderQuery, getSortQuery } from "components/infinite/controls/sort";
import InfiniteVideoView from "components/infinite/resource/video";
import { VideoSortingKeys } from "models/video";
import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, VideoSortingKeys);

	return {
		infiniteQueries: [
			API.getVideos({}, { sortBy, order }, [
				"artist",
				"master",
				"illustration",
			]),
		],
	};
};

const LibraryVideosPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("videos")} />
			<InfiniteVideoView
				query={({ libraries, sortBy, order, random, types }) =>
					API.getVideos(
						{ library: libraries, random, type: types },
						{ sortBy, order },
						["artist", "master", "illustration"],
					)
				}
				subtitle="artist"
			/>
		</>
	);
};

LibraryVideosPage.prepareSSR = prepareSSR;

export default LibraryVideosPage;
