import React, { useState } from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box, Card, Grid, CardContent, Typography, ButtonBase, CardActionArea, CardMedia, IconButton } from '@mui/material';
import { useQueries } from 'react-query';
import API from '../../../src/api';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import LoadingComponent from '../../../src/components/loading';
import Artist from '../../../src/models/artist';
import FadeIn from 'react-fade-in/lib/FadeIn';
import AccountCircle from '@mui/icons-material/AccountCircle';

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	const { isLoading, isSuccess, data } = useQuery(['libraries', 'artists', slug], () => API.getAllArtistsInLibrary(slug as string))
	return <>
		<MeeloAppBar/>
		{isLoading &&
			<Box width='100%' display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
				<LoadingComponent />
			</Box>
		}
		{!isLoading && isSuccess &&
			<Grid sx={{ padding: 2 }}container justifyContent='left' spacing={2}>
				{data.items.map((artist) => (
					<Grid item xs={6} md={3} lg={2}>
						<FadeIn><ArtistTile artist={artist} /></FadeIn>
					</Grid>)
				)}
			</Grid>
		}
	</>;
}

const ArtistTile = (props: { artist: Artist }) => {
	const [imageNotFound, setImageNotFound] = useState(false)
	return (
		<Card style={{ border: "none", boxShadow: "none" }}>
			<CardActionArea href={`/artists/${props.artist.slug}`}>
				<Box sx={{ padding: 4 }}>
				{ imageNotFound ?
					<CardMedia style={{ display:'flex', justifyContent:'center' }}> 
						<IconButton disableFocusRipple disableRipple sx={{ '& svg': {fontSize: 100} }}>
    						<AccountCircle />
    					</IconButton>
					</CardMedia> :
					<CardMedia
      				  	component="img"
      				  	image={API.getIllustrationURL(props.artist.illustration)}
						onError={() => setImageNotFound(true) }
      				/>
				}
				</Box>
				<CardContent style={{ display:'flex', justifyContent:'center' }}>
					<Typography>
						{props.artist.name}
					</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
			
	)
}

export default LibraryArtistsPage;