import { Typography } from "@mui/material";
import API from "../../api/api";
import { InfiniteQuery, useInfiniteQuery } from "../../api/use-query";
import Library from "../../models/library";
import Resource from "../../models/resource";
import InfiniteList from "../infinite/infinite-list";
import { Page } from "../infinite/infinite-scroll";
import LoadingComponent, { WideLoadingComponent } from "../loading/loading";

const librariesQuery = () => ({
	key: ['libraries'],
	exec: (lastPage: Page<Library>) => API.getAllLibraries(lastPage)
});

const LibrariesSettings = () => {
	return <>
		<InfiniteList
			query={librariesQuery}
			firstLoader={() => <WideLoadingComponent/>}
			loader={() => <LoadingComponent/>}
			render={(library: Library) => <Typography>{library.name}</Typography>}
		/>
	</>
};

export default LibrariesSettings;
