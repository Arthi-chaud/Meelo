import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Drawer, List, ListSubheader, ListItem, ListItemButton, ListItemText, Collapse, ListItemIcon, Divider, Grid } from "@mui/material";
import FadeIn from "react-fade-in";
import { UseQueryResult } from "react-query";
import Library from "../../models/library";
import { PaginatedResponse } from "../../models/pagination";
import LoadingComponent from "../loading";
import { itemType, getTypeIcon, formattedItemTypes } from "./item-types";
import SearchIcon from '@mui/icons-material/Search';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SettingsIcon from '@mui/icons-material/Settings';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import globalLibrary from './global-library';
import { useEffect, useState } from "react";
import buildLink from "./build-link";

interface DrawerProps {
	query: UseQueryResult<PaginatedResponse<Library>>,
	requestedLibrarySlug: string,
	isOpen: boolean,
	onClose: () => void
}

const MeeloAppBarDrawer = ({ query, requestedLibrarySlug, isOpen, onClose }: DrawerProps) => {
	const [selectedLibrarySlug, setSelectedLibrary] = useState<string | null>(requestedLibrarySlug);
	useEffect(() => setSelectedLibrary(requestedLibrarySlug), [requestedLibrarySlug, isOpen]);
	return (
		<Drawer
				elevation={8}
				PaperProps={{ sx: { width: '70%' } }}
				variant="temporary"
				open={isOpen}
				onClose={onClose}
				sx={{ display: { xs: 'block', sm: 'none' } }}
			>
			<List>
				<ListSubheader disableSticky={false}>
					<Grid container columnSpacing={2} sx={{ flexDirection: 'row', alignItems: 'center' }}>
						<Grid item sx={{ paddingTop: 1.6 }}><LibraryMusicIcon /></Grid>
						<Grid item>Libraries</Grid>
						<Grid item sx={{ flexGrow: 1 }} />
						{ query.isLoading ? <Grid item><LoadingComponent /></Grid> : <></>}
					</Grid>
				</ListSubheader>
				{
					query.isLoading || <FadeIn> {
						[globalLibrary, ...query.data!.items].map((library) => {
							const open = selectedLibrarySlug === library.slug;
							console.log(selectedLibrarySlug, library.slug);
							return (<><ListItem key={library.slug}>
								<ListItemButton onClick={() => setSelectedLibrary(open ? null : library.slug)}>
									<ListItemText>{library.title}</ListItemText>
									{open ? <ExpandLess /> : <ExpandMore />}
								</ListItemButton>
							</ListItem>
								<Collapse in={open} unmountOnExit>
									<List sx={{ pl: 4 }}>
										{itemType.map((item, index) => (
											<ListItemButton key={item} href={buildLink(item, library.slug)}>
												<ListItemIcon>
													{ getTypeIcon(item) }
												</ListItemIcon>
												<ListItemText primary={formattedItemTypes.at(index)} />
											</ListItemButton>
										))}
									</List>
								</Collapse>
							</>)
						})
					} </FadeIn>
				}
			</List>
			<Divider />
			<List>
				<ListItem disablePadding>
					<ListItemButton>
						<ListItemIcon>
							<SearchIcon />
						</ListItemIcon>
						<ListItemText>Search</ListItemText>
					</ListItemButton>
				</ListItem>
				<ListItem disablePadding>
					<ListItemButton>
						<ListItemIcon>
							<AutoModeIcon />
						</ListItemIcon>
						<ListItemText>Refresh Libraries</ListItemText>
					</ListItemButton>
				</ListItem>
				<ListItem disablePadding>
					<ListItemButton>
						<ListItemIcon>
							<SettingsIcon />
						</ListItemIcon>
						<ListItemText>Settings</ListItemText>
					</ListItemButton>
				</ListItem>
			</List>
		</Drawer>
	);
}

export default MeeloAppBarDrawer;