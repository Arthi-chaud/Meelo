import { Box, Tooltip, Slide, Button, Chip, Menu, MenuItem, ListItem, Hidden, Fab, ButtonGroup, IconButton, Divider, ListItemIcon, ListItemText } from "@mui/material";
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
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { capitalCase } from "change-case";
import CheckIcon from '@mui/icons-material/Check';

type ResourceWithoutRelation<T> = { [key in keyof T as T[key] extends Resource | undefined ? never : key]: T[key] };

type InfiniteViewProps<T, SortingFields extends string[] | [] = []> = {
	view: 'list' | 'grid';
	initialSortingField?: SortingFields[number];
	sortingFields?: SortingFields;
	sortingOrder?: 'asc' | 'desc';
	query: MeeloInfiniteQueryFn<T>;
	onSortingFieldSelect?: (selected: SortingFields[number]) => void;
	onSortingOrderSelect?: (selected: 'asc' | 'desc') => void;
	renderListItem: (item: T) => JSX.Element;
	listItemExpanded?: (item: T) => JSX.Element;
	renderGridItem: (item: T) => JSX.Element;
	enableToggle?: boolean;
}

type DisplayMethod = {
	name: 'list' | 'grid',
	icon: JSX.Element
}

const availableDisplayMethods: DisplayMethod[] = [
	{
		name: 'grid',
		icon: <AppsIcon/>
	},
	{
		name: 'list',
		icon: <ViewListIcon/>
	}
]

/**
 * Infinite scrolling view, which lets the user decide which way the data is displayed
 * @returns 
 */
const InfiniteView = <T extends Resource, Keys extends string[]>(props: InfiniteViewProps<T, Keys>) => {
	const [display, setDisplay] = useState(props.view);
	const [backToTopVisible, setBackToTopVisible] = useState(false);
	const [sortField, setSortField] = useState(props.sortingFields ? (props.initialSortingField ?? props.sortingFields[0]!) as Keys[number] : undefined);
	const [sortOrder, setSortOrder] = useState(props.sortingOrder ?? 'asc');
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  	const menuOpen = Boolean(anchorEl);
  	const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  	const handleMenuClose = () => setAnchorEl(null);
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
			<ButtonGroup color='inherit'>
				{ props.sortingFields && <>
					<Button
						endIcon={sortOrder == 'desc' ? <SouthIcon/> : <NorthIcon/>}
						onClick={handleMenuOpen}
					>
						{`Sort by ${capitalCase(sortField as string)}`}
					</Button>
					<Menu
    				    anchorEl={anchorEl}
    				    open={menuOpen}
    				    onClose={handleMenuClose}
						>
    				    { props.sortingFields.map((field) => (
							<MenuItem key={field as string} selected={field == sortField} onClick={() => {
								setSortField(field);
								props.onSortingFieldSelect && props.onSortingFieldSelect(field);
								handleMenuClose();
							}}>
								{capitalCase(field as string)}
							</MenuItem>
						))}
						<Divider/>
						{ ["asc", "desc"].map((order) => {
							const selected = order == sortOrder;
							return <MenuItem key={order} selected={selected} onClick={() => {
								setSortOrder(order as "asc" | "desc");
								props.onSortingOrderSelect && props.onSortingOrderSelect(order as 'asc' | 'desc');
								handleMenuClose();
							}}>
								<ListItemText>
									{capitalCase(order as string)}
								</ListItemText>
								{ selected &&
									<ListItemIcon>
										<CheckIcon/>
									</ListItemIcon>
								}
							</MenuItem>
						})}
    				</Menu>
				</>}
				{ props.enableToggle &&
					availableDisplayMethods.filter((method) => method.name != display)
						.map((method) => (
							<Tooltip title="Change layout" key={method.name}>
								<Button onClick={() => setDisplay(method.name)}>
									{ method.icon }
								</Button>
							</Tooltip>
						)
					)
				}
			</ButtonGroup>
		</Box>
		<Slide direction="up" in={backToTopVisible} mountOnEnter unmountOnExit>
			<Tooltip title="Back to top">
				<Fab
					color="secondary"
					sx={{  zIndex: "tooltip", position: 'fixed', bottom: 16, right: 16 }}
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