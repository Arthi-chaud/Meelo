import {Box, Card, CardActionArea, CardContent, CardMedia, IconButton, Typography} from "@mui/material";
import Artist from "../../models/artist";
import {AccountCircle} from "@mui/icons-material";
import API from "../../api";
import {useState} from "react";
import Tile from "./tile";

const ArtistTile = (props: { artist: Artist }) => {
	return <Tile
		title={props.artist.name}
		subtitle={props.artist.name}
		targetURL={`/artists/${props.artist.slug}`}
		illustrationURL={API.getIllustrationURL(props.artist.illustration)}
		illustrationFallback={() => 
			<IconButton disableFocusRipple disableRipple sx={{ '& svg': {fontSize: 100} }}>
				<AccountCircle />
			</IconButton>
		}
	/>
}

export default ArtistTile;