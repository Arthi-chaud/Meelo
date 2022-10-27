import {Box, Card, CardActionArea, CardContent, CardMedia, IconButton, Typography} from "@mui/material";
import Artist from "../../models/artist";
import {AccountCircle} from "@mui/icons-material";
import API from "../../api";
import {useState} from "react";
import Tile from "./tile";
import Illustration from "../illustration";

const ArtistTile = (props: { artist: Artist }) => {
	return <Tile
		title={props.artist.name}
		targetURL={`/artists/${props.artist.slug}`}
		illustration={<Illustration url={props.artist.illustration} fallback={<AccountCircle />}/>}
	/>
}

export default ArtistTile;