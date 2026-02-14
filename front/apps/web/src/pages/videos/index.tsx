import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getVideos } from "@/api/queries";
import { VideoSortingKeys } from "@/models/video";
import { Head } from "~/components/head";
import { ssrGetSortingParameter } from "~/components/infinite/controls/sort";
import InfiniteVideoView from "~/components/infinite/resource/video";

const prepareSSR = (context: NextPageContext) => {
	const sort = ssrGetSortingParameter(VideoSortingKeys, context);

	return {
		infiniteQueries: [
			getVideos({}, sort, ["artist", "master", "illustration"]),
		],
	};
};

const LibraryVideosPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("models.video_plural")} />
			<InfiniteVideoView
				query={({ libraries, sortBy, order, random, types }) =>
					getVideos(
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
