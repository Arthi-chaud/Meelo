import { Box, Tooltip, Slide, Button, Chip, Menu, MenuItem, ListItem, Hidden, Fab, ButtonGroup, IconButton } from "@mui/material";
import FadeIn from "react-fade-in";
import Resource from "../../models/resource";
import StraightIcon from "@mui/icons-material/Straight"
import { MeeloInfiniteQueryFn } from "../../query";
import { WideLoadingComponent } from "../loading/loading";
import LoadingPage from "../loading/loading-page";
import InfiniteGrid from "./infinite-grid";
import InfiniteList from "./infinite-list";
import AppsIcon from '@mui/icons-material/Apps';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useEffect, useState } from 'react';

type InfiniteViewProps<T> = {
	view: string | 'list' | 'grid';
	query: MeeloInfiniteQueryFn<T>;
	renderListItem: (item: T) => JSX.Element;
	listItemExpanded?: (item: T) => JSX.Element;
	renderGridItem: (item: T) => JSX.Element;
	enableToggle?: boolean;
}

type DisplayMethod = {
	name: string,
	icon: JSX.Element
}

const availableDisplayMethods: DisplayMethod[] = [
	{
		name: 'Grid',
		icon: <AppsIcon/>
	},
	{
		name: 'List',
		icon: <ViewListIcon/>
	}
]

/**
 * Infinite scrolling view, which lets the user decide which way the data is displayed
 * @returns 
 */
const InfiniteView = <T extends Resource,>(props: InfiniteViewProps<T>) => {
	const [display, setDisplay] = useState(props.view.toLowerCase());
	const [backToTopVisible, setBackToTopVisible] = useState(false);
	const handleScroll = () => {
		const position = window.pageYOffset;
		setBackToTopVisible(position > window.innerHeight);
	};
	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);
	return <>
		<Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', paddingTop: 2 }}>
			{ props.enableToggle &&
				<ButtonGroup variant="contained">
					{ availableDisplayMethods.filter((method) => method.name.toLowerCase() != display)
						.map((method) => (
							<Tooltip title="Change layout" key={method.name}>
								<Button
									onClick={() => setDisplay(method.name.toLowerCase())}
								>
									{ method.icon }
								</Button>
							</Tooltip>
						)
					)}
				</ButtonGroup>
			}
		</Box>
		<Slide direction="up" in={backToTopVisible} mountOnEnter unmountOnExit>
			<Tooltip title="Back to top">
				<Fab
					color="primary"
					sx={{ position: 'fixed', bottom: 16, right: 16 }}
					onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
				>
					<StraightIcon/>
				</Fab>
			</Tooltip>
		</Slide>
		{ display.toLowerCase() == 'list'
			? <InfiniteList
				firstLoader={() => <LoadingPage/>}
				loader={() => <WideLoadingComponent/>}
				query={props.query}
				render={(item: T) =>
					<FadeIn key={item.id}>
						{ props.renderListItem(item) }
					</FadeIn>
				}
			/>
			: <InfiniteGrid
				query={props.query}
				firstLoader={() => <LoadingPage/>}
				loader={() => <WideLoadingComponent/>}
				render={props.renderGridItem}
			/>
		}

	</>
}

export default InfiniteView;