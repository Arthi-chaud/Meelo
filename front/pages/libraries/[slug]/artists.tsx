import React, { useState } from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box, Card, Grid, CardContent, Typography, ButtonBase, CardActionArea, CardMedia, IconButton, Paper } from '@mui/material';
import { useQueries } from 'react-query';
import API from '../../../src/api';
import { useRouter } from 'next/router';
import { useQuery, useInfiniteQuery } from 'react-query';
import LoadingComponent from '../../../src/components/loading';
import Artist from '../../../src/models/artist';
import FadeIn from 'react-fade-in/lib/FadeIn';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { PaginatedResponse } from '../../../src/models/pagination';
import InfiniteScroll from 'react-infinite-scroller';

type Page<T> = {
	items: T[],
	index: number,
	nextURL: string | null
}

const pageSize = 30;

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	const fetchArtists = (lastPage: Page<Artist> | undefined) => API.getAllArtistsInLibrary(
		slug as string,
		{ skip: pageSize * (lastPage?.index ?? 0), take: pageSize }
	).then((result) => ({
		items: result.items,
		index: (lastPage?.index ?? 0) + 1,
		nextURL: result.metadata.next
	}));
	const {
        isFetching,
        isError,
		isSuccess,
        data,
		hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteQuery(['libraries', 'artists', slug], (context) => fetchArtists(context.pageParam), {
        getNextPageParam: (lastPage: Page<Artist>): Page<Artist> | undefined  => {
			if (lastPage.nextURL === null || lastPage.items.length < pageSize)
				return undefined;
			return lastPage;
        },
		
    })
	return <>
		<MeeloAppBar/>
		{ (isFetching && data?.pages.length == 0) &&
			<Box width='100%' display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
				<LoadingComponent />
			</Box>
		}
		<InfiniteScroll
		    pageStart={0}
		    loadMore={() => {
				console.log("Loading more");
				if (hasNextPage && !isFetchingNextPage)
					fetchNextPage().then((result) => console.log(hasNextPage))
			}}
		    hasMore={() => hasNextPage}
		>
		{isSuccess &&
			<Grid sx={{ padding: 2 }} container rowSpacing={4} columnSpacing={2}>
				{data!.pages.map((page) => page.items.map((artist) =>
					<Grid item xs={6} md={12/5} lg={2} xl={1.5} style={{ height: '100%' }} key={artist.slug}>
						<FadeIn><ArtistTile artist={artist} /></FadeIn>
					</Grid>
				))}
			</Grid>
		}
		{ isFetchingNextPage && 
			<FadeIn>
				<Box width='100%' display="flex" justifyContent="center" paddingY={10}>
						<LoadingComponent/>
				</Box>
			</FadeIn>
		}
		</InfiniteScroll>
	</>;
}

const ArtistTile = (props: { artist: Artist }) => {
	const [imageNotFound, setImageNotFound] = useState(false)
	return (
		<Box sx={{ height: '100%' }}>
		<Card /*style={{ border: "none", boxShadow: "none" }}*/>
			<CardActionArea href={`/artists/${props.artist.slug}`}>
				<Box sx={{ padding: 4 }}>
				{ imageNotFound ?
					<CardMedia style={{ display: 'flex', justifyContent: 'center' }}> 
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
		</Card></Box>
			
	)
}

export default LibraryArtistsPage;