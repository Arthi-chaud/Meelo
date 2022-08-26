import React from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box } from '@mui/material';

const LibrarySongsPage: NextPage = () => {
	return <Box>
		<MeeloAppBar/>
		List of Songs
	</Box>;
} 

export default LibrarySongsPage;