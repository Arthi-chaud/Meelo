import React, { useState } from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box, Card, Grid, CardContent, Typography, ButtonBase, CardActionArea, CardMedia, IconButton, Paper } from '@mui/material';
import API from '../../../src/api';
import { useRouter } from 'next/router';
import Artist from '../../../src/models/artist';
import FadeIn from 'react-fade-in/lib/FadeIn';

import ArtistTile from '../../../src/components/artist-tile';
import InfiniteList from '../../../src/components/infinite-list';

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	return <>
		<MeeloAppBar/>
		<InfiniteList
			fetch={(lastPage, pageSize) => API.getAllArtistsInLibrary(
				slug as string,
				{ skip: pageSize * (lastPage?.index ?? 0), take: pageSize }
			).then((result) => ({
				pageSize: pageSize,
				items: result.items,
				index: (lastPage?.index ?? 0) + 1,
				end: result.metadata.next === null
			}))}
			queryKey={['libraries', slug as string, 'artists']}
			render={(items: Artist[]) => (
				<Grid sx={{ padding: 2 }} container rowSpacing={4} columnSpacing={2}>
				 	{items.map((artist) => 
				 		<Grid item xs={6} md={12/5} lg={2} xl={1.5} style={{ height: '100%' }} key={artist.slug}>
				 			<FadeIn><ArtistTile artist={artist} /></FadeIn>
				 		</Grid>
				 	)}
				 </Grid>
			)}
		/>
	</>;
}


export default LibraryArtistsPage;