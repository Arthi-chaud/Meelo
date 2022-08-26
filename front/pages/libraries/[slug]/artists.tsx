import React from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box } from '@mui/material';

const LibraryArtistsPage: NextPage = () => {
	return <Box>
		<MeeloAppBar/>
		List of Artists
	</Box>;
} 

export default LibraryArtistsPage;