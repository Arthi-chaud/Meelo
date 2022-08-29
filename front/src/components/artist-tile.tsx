import {Box, Card, CardActionArea, CardContent, CardMedia, IconButton, Typography} from "@mui/material";
import Artist from "../models/artist";
import {AccountCircle} from "@mui/icons-material";
import API from "../api";
import {useState} from "react";

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

export default ArtistTile;