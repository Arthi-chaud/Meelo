import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Drawer, List, ListSubheader, ListItem, ListItemButton, ListItemText, Collapse, ListItemIcon, Divider, Grid, Container } from "@mui/material";
import FadeIn from "react-fade-in";
import { UseQueryResult } from "react-query";
import Library from "../../models/library";
import { PaginatedResponse } from "../../models/pagination";
import LoadingComponent from "../loading/loading";
import { itemType, getTypeIcon, formattedItemTypes } from "./item-types";
import SearchIcon from '@mui/icons-material/Search';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SettingsIcon from '@mui/icons-material/Settings';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import globalLibrary from './global-library';
import { useEffect, useState } from "react";
import buildLink from "./build-link";
import Link from 'next/link';

interface DrawerProps {
	availableLibraries: Library[] | null,
	requestedLibrarySlug: string,
	isOpen: boolean,
	onClose: () => void
}

const MeeloAppBarDrawer = ({ availableLibraries, requestedLibrarySlug, isOpen, onClose }: DrawerProps) => {
	const [selectedLibrarySlug, setSelectedLibrary] = useState<string | null>(requestedLibrarySlug);
	useEffect(() => setSelectedLibrary(requestedLibrarySlug), [requestedLibrarySlug, isOpen]);
	return (
		<Drawer
			elevation={8}
			PaperProps={{ sx: { width: '70%' } }}
			variant="temporary"
			open={isOpen}
			onClose={onClose}
			sx={{ display: { xs: 'block', md: 'none' } }}
		>
			<List subheader={
				<ListSubheader disableSticky={false} sx={{ color: 'inherit' }}>
					<Grid container columnSpacing={2} sx={{ flexDirection: 'row', alignItems: 'center' }}>
						<Grid item sx={{ paddingTop: 1.6 }}><LibraryMusicIcon /></Grid>
						<Grid item>Libraries</Grid>
						<Grid item sx={{ flexGrow: 1 }} />
						{ availableLibraries == null && <Grid item><LoadingComponent /></Grid>}
					</Grid>
				</ListSubheader>
			}>
				{
					availableLibraries == null || <FadeIn> {
						[globalLibrary, ...availableLibraries].map((library) => {
							const open = selectedLibrarySlug === library.slug;
							return (<Container key={library.slug}>
							<ListItem>
								<ListItemButton onClick={() => setSelectedLibrary(open ? null : library.slug)}>
									<ListItemText>{library.name}</ListItemText>
									{open ? <ExpandLess /> : <ExpandMore />}
								</ListItemButton>
							</ListItem>
							<Collapse in={open} unmountOnExit>
								<List sx={{ pl: 4 }}>
									{itemType.map((item, index) => (
										<Link key={item} href={buildLink(item, library.slug)}>
											<ListItemButton key={item} onClick={onClose}>
												<ListItemIcon>
													{ getTypeIcon(item) }
												</ListItemIcon>
												<ListItemText primary={formattedItemTypes.at(index)} />
											</ListItemButton>
										</Link>
									))}
								</List>
							</Collapse>
							</Container>)
						})
					} </FadeIn>
				}
			</List>
			<Divider />
			<List>
				<ListItem disablePadding>
					<Link href="/search">
						<ListItemButton onClick={onClose}>
							<ListItemIcon>
								<SearchIcon />
							</ListItemIcon>
							<ListItemText>Search</ListItemText>
						</ListItemButton>
					</Link>
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