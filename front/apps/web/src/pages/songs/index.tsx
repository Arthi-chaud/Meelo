import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getSongGroups, getSongs } from "~/api/queries";
import { Head } from "~/components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "~/components/infinite/controls/sort";
import { HybridInfiniteSongView } from "~/components/infinite/resource/song";
import { SongSortingKeys } from "@meelo/models/song";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, SongSortingKeys);

	return {
		additionalProps: { order, sortBy },
		infiniteQueries: [
			getSongs({}, { sortBy, order }, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
		],
	};
};

const SongsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("models.song_plural")} />
			<HybridInfiniteSongView
				song={{
					query: ({ sortBy, order, types, libraries, random }) =>
						getSongs(
							{
								type: types,
								library: libraries,
								random,
							},
							{ sortBy, order },
							["artist", "featuring", "master", "illustration"],
						),
				}}
				songGroup={{
					query: ({ libraries, type }) =>
						getSongGroups(
							{
								type: type,
								library: libraries,
							},
							{ sortBy: "name", order: "asc" },
							["artist", "featuring", "master", "illustration"],
						),
				}}
			/>
		</>
	);
};

SongsPage.prepareSSR = prepareSSR;

export default SongsPage;
