import InfinitePlaylistView from "../../components/infinite/infinite-resource-view/infinite-playlist-view";
import API from "../../api/api";
import { PlaylistSortingKeys } from "../../models/playlist";
import prepareSSR, { InferSSRProps } from "../../ssr";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import { getLayoutParams } from "../../utils/layout";

export const getServerSideProps = prepareSSR((context) => {
	const defaultLayout = getLayoutParams(context.query.view) ?? "list";
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		PlaylistSortingKeys,
	);

	return {
		additionalProps: { defaultLayout, order, sortBy },
		infiniteQueries: [API.getPlaylists({}, { sortBy, order })],
	};
});

const PlaylistsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	return (
		<InfinitePlaylistView
			initialSortingField={props.additionalProps?.sortBy}
			initialSortingOrder={props.additionalProps?.order}
			defaultLayout={props.additionalProps?.defaultLayout}
			query={(sort) => API.getPlaylists({}, sort)}
		/>
	);
};

export default PlaylistsPage;
