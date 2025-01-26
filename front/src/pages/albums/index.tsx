import API from "../../api/api";
import { AlbumSortingKeys } from "../../models/album";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import InfiniteAlbumView from "../../components/infinite/infinite-resource-view/infinite-album-view";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import { getLayoutParams } from "../../utils/layout";
import { getAlbumTypeParam } from "../../utils/album-type";
import type { NextPageContext } from "next";
import { Head } from "../../components/head";
import { useTranslation } from "react-i18next";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		AlbumSortingKeys,
	);
	const type = getAlbumTypeParam(context.query.type);
	const defaultLayout = getLayoutParams(context.query.view) ?? "grid";

	return {
		additionalProps: { sortBy, order, defaultLayout, type: type ?? null },
		infiniteQueries: [
			API.getAlbums({ type: type ?? undefined }, { sortBy, order }, [
				"artist",
				"illustration",
			]),
		],
	};
};

const LibraryAlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const defaultType = props?.type ?? null;
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("albums")} />
			<InfiniteAlbumView
				defaultAlbumType={defaultType}
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				defaultLayout={props?.defaultLayout}
				query={({ sortBy, order, type, library }) =>
					API.getAlbums(
						{ type, library: library ?? undefined },
						{ sortBy, order },
						["artist", "illustration"],
					)
				}
			/>
		</>
	);
};

LibraryAlbumsPage.prepareSSR = prepareSSR;

export default LibraryAlbumsPage;
