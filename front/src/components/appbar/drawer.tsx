import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
	Collapse, Container, Divider, Drawer, Grid, List,
	ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader
} from "@mui/material";
import FadeIn from "react-fade-in";
import Library from "../../models/library";
import LoadingComponent from "../loading/loading";
import {
	formattedItemTypes, getTypeIcon, itemType
} from "./item-types";
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import globalLibrary from './global-library';
import { useEffect, useState } from "react";
import buildLink from "./build-link";
import Link from 'next/link';
import AppBarActions from "./actions";

interface DrawerProps {
	availableLibraries: Library[] | null,
	requestedLibrarySlug: string,
	isOpen: boolean,
	onClose: () => void
}

const MeeloAppBarDrawer = (
	{ availableLibraries, requestedLibrarySlug, isOpen, onClose }: DrawerProps
) => {
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
					<Grid container columnSpacing={2}
						sx={{ flexDirection: 'row', alignItems: 'center' }}
					>
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

							return <Container key={library.slug}>
								<ListItem>
									<ListItemButton onClick={() =>
										setSelectedLibrary(open ? null : library.slug)
									}>
										<ListItemText>{library.name}</ListItemText>
										{open ? <ExpandLess /> : <ExpandMore />}
									</ListItemButton>
								</ListItem>
								<Collapse in={open} unmountOnExit>
									<List sx={{ pl: 4 }}>
										{itemType.map((item, index) =>
											<Link key={item} href={buildLink(item, library.slug)}>
												<ListItemButton key={item} onClick={onClose}>
													<ListItemIcon>
														{ getTypeIcon(item) }
													</ListItemIcon>
													<ListItemText
														primary={formattedItemTypes.at(index)}
													/>
												</ListItemButton>
											</Link>)}
									</List>
								</Collapse>
							</Container>;
						})
					} </FadeIn>
				}
			</List>
			<Divider />
			<List>
				{ AppBarActions.map((action) => {
					const item = <ListItemButton
						key={action.label} disabled={action.disabled}
						style={{ borderRadius: 0 }}
						onClick={() => {
							action.onClick && action.onClick();
							onClose();
						}}
					>
						<ListItemIcon>{action.icon}</ListItemIcon>
						<ListItemText>{action.label}</ListItemText>
					</ListItemButton>;

					if (action.href) {
						return <Link href={action.href} key={action.label}>
							{item}
						</Link>;
					}
					return item;
				})}
			</List>
		</Drawer>
	);
};

export default MeeloAppBarDrawer;
