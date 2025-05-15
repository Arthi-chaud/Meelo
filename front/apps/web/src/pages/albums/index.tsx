import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getAlbums } from "~/api/queries";
import { Head } from "~/components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "~/components/infinite/controls/sort";
import InfiniteAlbumView from "~/components/infinite/resource/album";
import { AlbumSortingKeys } from "@/models/album";

const isCompilationPage = ({ asPath }: { asPath?: string }) =>
	asPath?.includes("/compilations") ?? false;

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, AlbumSortingKeys);

	return {
		infiniteQueries: [
			getAlbums(
				{
					artist: isCompilationPage(context)
						? "compilations"
						: undefined,
				},
				{ sortBy, order },
				["artist", "illustration"],
			),
		],
	};
};

const AlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<>
			<Head title={t("models.album_plural")} />
			<InfiniteAlbumView
				query={({ sortBy, order, types, libraries }) =>
					getAlbums(
						{
							type: types,
							library: libraries,
							artist: isCompilationPage(router)
								? "compilations"
								: undefined,
						},
						{ sortBy, order },
						["artist", "illustration"],
					)
				}
			/>
		</>
	);
};

AlbumsPage.prepareSSR = prepareSSR;

export default AlbumsPage;
