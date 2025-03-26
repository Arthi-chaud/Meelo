import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { Head } from "../../components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "../../components/infinite/controls/sort";
import InfiniteVideoView from "../../components/infinite/infinite-resource-view/infinite-video-view";
import { VideoSortingKeys } from "../../models/video";
import type { GetPropsTypesFrom, Page } from "../../ssr";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, VideoSortingKeys);

	return {
		additionalProps: { sortBy, order },
		infiniteQueries: [
			API.getVideos({}, { sortBy, order }, [
				"artist",
				"master",
				"illustration",
			]),
		],
	};
};

const LibraryVideosPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("videos")} />
			<InfiniteVideoView
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				query={({ library, sortBy, order, random, type }) =>
					API.getVideos(
						{ library: library ?? undefined, random, type },
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
