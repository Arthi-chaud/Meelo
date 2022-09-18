import { List, Divider } from "@mui/material";
import FadeIn from "react-fade-in";
import Resource from "../../models/resource";
import { SongWithArtist } from "../../models/song";
import { MeeloInfiniteQueryFn } from "../../query";
import { WideLoadingComponent } from "../loading/loading";
import LoadingPage from "../loading/loading-page";
import SongItem from "../list-item/song-item";
import InfiniteGrid from "./infinite-grid";
import InfiniteList from "./infinite-list";

type InfiniteViewProps<T> = {
	view: 'list' | 'grid';
	items: T[];
	query: MeeloInfiniteQueryFn<T>;
	renderListItem: (item: T) => JSX.Element;
	listItemExpanded?: (item: T) => JSX.Element;
	renderGridItem: (item: T) => JSX.Element;
}


/**
 * Infinite scrolling view, which lets the user decide which way the data is displayed
 * @returns 
 */
const InfiniteView = <T extends Resource,>(props: InfiniteViewProps<T>) => {
	if (props.view == 'list') {
		return <InfiniteList
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			query={props.query}
			render={(item: T) =>
				<FadeIn>
					{ props.renderListItem(item) }
				</FadeIn>
			}
		/>
	} else {
		return <InfiniteGrid
			query={props.query}
			firstLoader={() => <LoadingPage/>}
			loader={() => <WideLoadingComponent/>}
			render={props.renderGridItem}
		/>
	}
}

export default InfiniteView;