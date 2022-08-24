import { AppBar, Toolbar, Typography, Box, Button, Divider, IconButton, Grid, Container } from '@mui/material';
import type { NextPage } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Home: NextPage = () => {
	const router = useRouter();
	return (
		<Box >
			<AppBar position="static" style={{ padding: 10 }}>
				<Toolbar variant="dense">
					<Box style={{ paddingRight: 30 }}>
						<Image src="/banner.png" alt="me" width={120} height={50} />
					</Box>
					<Box sx={{ display: { xs: 'none', sm: 'flex' }, marginLeft: 1 }} flexDirection='row'>
						Library
						<Divider orientation='vertical' flexItem sx={{ paddingLeft: 3 }}/>
						<Grid container spacing={4} sx={{ paddingLeft: 3 }}>
							<Grid item><Typography variant='button' sx={{ fontWeight: router.asPath.endsWith('/artists') ? 'bold' : 'normal' }}> Artists</Typography></Grid>
							<Grid item><Typography variant='button' sx={{ fontWeight: router.asPath.endsWith('/albums') ? 'bold' : 'normal' }}> Albums</Typography></Grid>
							<Grid item><Typography variant='button' sx={{ fontWeight: router.asPath.endsWith('/songs') ? 'bold' : 'normal' }}> Songs</Typography></Grid>
						</Grid>
					</Box>
					<Box sx={{ flexGrow: 1 }}/>
					<Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
						<IconButton>
							<SearchIcon />
						</IconButton>
						<Divider orientation='vertical' flexItem sx={{ marginX: 2 }}/>
						<IconButton>
							<MoreVertIcon />
						</IconButton>
					</Box>
				</Toolbar>
			</AppBar>
		</Box>
	)
}

export default Home
