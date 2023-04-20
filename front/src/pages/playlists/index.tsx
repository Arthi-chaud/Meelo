import InfinitePlaylistView from "../../components/infinite/infinite-resource-view/infinite-playlist-view";
import API from "../../api/api";
import { PlaylistSortingKeys } from "../../models/playlist";
import prepareSSR from "../../ssr";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";

export const getServerSideProps = prepareSSR((context) => {
	const order = getOrderParams(context.query.order);
	const sortBy = getSortingFieldParams(context.query.sortBy, PlaylistSortingKeys);

	return {
		infiniteQueries: [API.getAllPlaylists({ sortBy, order })]
	};
});

const PlaylistsPage = () => {
	return <InfinitePlaylistView
		defaultLayout='list'
		query={(sort) => API.getAllPlaylists(sort)}
	/>;
};

export default PlaylistsPage;
