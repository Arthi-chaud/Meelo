import { useRouter } from "next/router";
import { VideoSortingKeys } from "../../models/video";
import API from "../../api/api";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import InfiniteVideoView from "../../components/infinite/infinite-resource-view/infinite-video-view";
import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import { Head } from "../../components/head";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		VideoSortingKeys,
	);

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
	const router = useRouter();
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
