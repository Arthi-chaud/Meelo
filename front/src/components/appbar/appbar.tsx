/* eslint-disable react/jsx-indent */
import {
	AppBar, Box, Button, Divider, Grid, IconButton,
	Toolbar, Typography, useTheme
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { itemType } from './item-types';
import MeeloAppBarDrawer from './drawer';
import Link from 'next/link';
// eslint-disable-next-line no-restricted-imports
import ContextualMenu from '../contextual-menu/contextual-menu';
import { GoToSearchAction } from '../actions/link';
import useColorScheme from '../../theme/color-scheme';
import Translate from '../../i18n/translate';
import Fade from '../fade';
import useAppBarActions from '../../utils/useAppBarActions';
import { BurgerIcon } from '../icons';

const MeeloAppBar = () => {
	const router = useRouter();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const actions = useAppBarActions();
	const colorScheme = useColorScheme();
	const theme = useTheme();

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
						<BurgerIcon />
					</IconButton>
					<Box style={{ paddingRight: 25 }}>
						<Link href="/" style={{ cursor: 'pointer' }}>
							<Image src="/banner.png" alt="icon" width={120}
								priority height={50}/>
						</Link>
					</Box>
					<Fade in>
						<Box sx={{ display: { xs: 'none', md: 'flex' }, marginLeft: 1, alignItems: 'center' }} flexDirection='row'>
							<Grid container spacing={3} flexDirection='row'
								sx={{ flexWrap: 'nowrap' }}
							>
								{ itemType.map((type) => {
									const isSelected = router.route == `/${type}`;

									return <Grid item key={type}>
										<Link href={`/${type}`}>
											<Button variant="text" color='inherit'>
												<Typography sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
													<Translate translationKey={type} />
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
								[actions.filter((action) => action.label != 'search')]
							}/>
						</Box>
					</Fade>
				</Toolbar>
			</AppBar>
			<MeeloAppBarDrawer
				isOpen={drawerOpen}
				onClose={() => setDrawerOpen(false)}
			/>
		</>
	);
};

export default MeeloAppBar;
