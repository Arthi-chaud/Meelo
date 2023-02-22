/* eslint-disable react/jsx-indent */
import {
	AppBar, Box, Button, Divider, Fade, Grid, IconButton,
	MenuItem, Select, Toolbar, Typography
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import MenuIcon from '@mui/icons-material/Menu';
import {
	useEffect, useMemo, useState
} from 'react';
import API from '../../api/api';
import LoadingComponent from '../loading/loading';
import { formattedItemTypes, itemType } from './item-types';
import globalLibrary from './global-library';
import MeeloAppBarDrawer from './drawer';
import buildLink from './build-link';
import Link from 'next/link';
// eslint-disable-next-line no-restricted-imports
import { useInfiniteQuery as useReactInfiniteQuery } from 'react-query';
import { prepareMeeloInfiniteQuery } from '../../api/use-query';
import Library from '../../models/library';
import toast from 'react-hot-toast';
import ContextualMenu from '../contextual-menu/contextual-menu';
import getAppBarActions from './actions';
import { GoToSearchAction } from '../actions/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';

const MeeloAppBar = () => {
	const router = useRouter();
	const [requestedLibrary, setRequestedLibrary] = useState(globalLibrary);
	const [availableLibraries, setAvailableLibraries] = useState<Library[] | null>(null);
	const colorSchemeSetting = useSelector((state: RootState) => state.settings.colorScheme);
	const actions = useMemo(() => getAppBarActions(colorSchemeSetting), [colorSchemeSetting]);
	const librariesQuery = useReactInfiniteQuery({
		...prepareMeeloInfiniteQuery(API.getAllLibraries),
		useErrorBoundary: false
	});

	useEffect(() => {
		if (librariesQuery.error) {
			if (availableLibraries == null) {
				toast.error("Libraries could not be loaded");
			}
			setAvailableLibraries([]);
		} else if (librariesQuery.data) {
			let requestedlibrarySlug = globalLibrary.slug;

			if (router.asPath.startsWith('/libraries')) {
				requestedlibrarySlug = router.asPath.split('/')[2];
			}
			setRequestedLibrary(librariesQuery.data?.pages.at(0)?.items.find(
				(library) => library.slug === requestedlibrarySlug
			) ?? globalLibrary);
			setAvailableLibraries(librariesQuery.data.pages.at(0)?.items ?? []);
		}
	}, [
		router.asPath,
		librariesQuery.data,
		librariesQuery.error,
		availableLibraries
	]);
	const [drawerOpen, setDrawerOpen] = useState(false);

	return (
		<>
			<AppBar position="sticky" style={{ padding: 5 }} elevation={1}>
				<Toolbar>
					<IconButton
						color="inherit"
						edge="start"
						onClick={() => setDrawerOpen(true)}
						sx={{ mr: 2, display: { md: 'none' } }}
					>
						<MenuIcon />
					</IconButton>
					<Box style={{ paddingRight: 25 }}>
						<Link href="/albums" style={{ cursor: 'pointer' }}>
							<Image src="/banner.png" alt="icon" width={120}
								priority height={50}/>
						</Link>
					</Box>
					{
						availableLibraries == null
							? <LoadingComponent />
							: <><Fade in>
								<Box sx={{ display: { xs: 'none', md: 'flex' }, marginLeft: 1, alignItems: 'center' }} flexDirection='row'>
									<Select
										disableUnderline
										variant='standard'
										value={requestedLibrary.name}
										onChange={(item) => {
											const targetLibaryName = item.target.value;

											if (targetLibaryName === globalLibrary.name) {
												router.push(`/albums`);
											} else {
												const targetLibrary = availableLibraries.find(
													(library) => library.name === targetLibaryName
												)!;

												router.push(`/libraries/${targetLibrary.slug}/albums`);
											}
										}}
									>
										{[globalLibrary, ...availableLibraries].map((library) =>
											<MenuItem key={library.slug} value={library.name} sx={{ borderRadius: '0' }}>
												{library.name}
											</MenuItem>)}
									</Select>
									<Divider orientation='vertical' flexItem sx={{ marginX: 2 }} />
									<Grid container spacing={3} flexDirection='row'
										sx={{ flexWrap: 'nowrap' }}
									>
										{ itemType.map((type, index) => {
											const isSelected = router.route == `/${type}`;

											return <Grid item key={type}>
												<Link href={buildLink(type, requestedLibrary.slug)}>
													<Button variant="text" color='inherit'>
														<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
															{formattedItemTypes.at(index)}
														</Typography>
													</Button>
												</Link>
											</Grid>;
										})}
									</Grid>
								</Box>
							</Fade>
							<Box sx={{ flexGrow: 1 }}/>
							<Fade in>
								<Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
									<Link href={GoToSearchAction.href}>
										<IconButton color='inherit'>
											{GoToSearchAction.icon}
										</IconButton>
									</Link>
									<Divider orientation='vertical' flexItem sx={{ marginX: 1 }} />
									<ContextualMenu actions={
										[actions.filter((action) => action.label.toLowerCase() != 'search')]
									}/>
								</Box>
							</Fade>
							</>
					}
				</Toolbar>
			</AppBar>
			<MeeloAppBarDrawer
				availableLibraries={availableLibraries}
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				requestedLibrarySlug={requestedLibrary.slug}
			/>
		</>
	);
};

export default MeeloAppBar;
