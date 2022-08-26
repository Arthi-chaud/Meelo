import React from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box } from '@mui/material';

const LibraryAlbumsPage: NextPage = () => {
	return <Box>
		<MeeloAppBar/>
		List of Albums
	</Box>;
} 

export default LibraryAlbumsPage;