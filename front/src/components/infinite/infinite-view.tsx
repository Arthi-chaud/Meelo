import {
	Box, Fab, Slide, Tooltip
} from "@mui/material";
import StraightIcon from "@mui/icons-material/Straight";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { WideLoadingComponent } from "../loading/loading";
import LoadingPage from "../loading/loading-page";
import InfiniteGrid from "./infinite-grid";
import InfiniteList from "./infinite-list";
import { useEffect, useState } from 'react';
import Resource from "../../models/resource";
import Translate from "../../i18n/translate";
import Fade from "../fade";

export type InfiniteViewProps<ItemType> = {
	view: 'list' | 'grid';
	query: MeeloInfiniteQueryFn<ItemType>;
	renderListItem: (item: ItemType) => JSX.Element;
	renderGridItem: (item: ItemType) => JSX.Element;
}

/**
 * Infinite scrolling view, which lets the user decide which way the data is displayed
 * @returns
 */
const InfiniteView = <ItemType extends Resource, >(
	props: InfiniteViewProps<ItemType>
) => {
	const [backToTopVisible, setBackToTopVisible] = useState(false);
	const handleScroll = () => {
		const position = window.scrollY;

		setBackToTopVisible(position > window.innerHeight);
	};

	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);
	return <>
		<Slide direction="up" in={backToTopVisible} mountOnEnter unmountOnExit>
			<Tooltip title={<Translate translationKey="backToTop"/>}>
				<Fab
					color="secondary"
					sx={{ zIndex: "tooltip", position: 'fixed', bottom: 16, right: 16 }}
					onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
				>
					<StraightIcon/>
				</Fab>
			</Tooltip>
		</Slide>
		{ props.view.toLowerCase() == 'list'
			? <InfiniteList
				firstLoader={() => <LoadingPage/>}
				loader={() => <WideLoadingComponent/>}
				query={props.query}
				render={(item: ItemType) =>
					<Fade in>
						<Box key={item.id}>
							{ props.renderListItem(item) }
						</Box>
					</Fade>
				}
			/> :
			<InfiniteGrid
				query={props.query}
				firstLoader={() => <LoadingPage/>}
				loader={() => <WideLoadingComponent/>}
				render={(item: ItemType) =>
					<Fade in>
						<Box sx={{ height: '100%' }}>
							{ props.renderGridItem(item) }
						</Box>
					</Fade>
				}
			/>
		}

	</>;
};

export default InfiniteView;
