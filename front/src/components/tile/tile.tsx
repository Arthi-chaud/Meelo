import AspectRatio from '@mui/joy/AspectRatio';
import {Box, Card, CardActionArea, CardContent, CardMedia, IconButton, Typography} from "@mui/material";
import {useState} from "react";
import Illustration from '../illustration';

type TileProps = {
	title: string,
	subtitle?: string
	thirdTitle?: string,
	illustrationURL: string,
	/**
	 * Fallback element on illustration download failure
	 */
	illustrationFallback: () => JSX.Element,
	/**
	 * URL to push on tile tap
	 */
	targetURL?: string
}

const Tile = (props: TileProps) => {
	const [imageNotFound, setImageNotFound] = useState(false);
	return (
		<Box sx={{ height: '100%' }}>
			<Card style={{ border: "none", boxShadow: "none" }}>
				<CardActionArea href={props.targetURL}>
					<AspectRatio ratio="1">
					{ imageNotFound ?
						<CardMedia style={{ display: 'flex', justifyContent: 'center' }}> 
							{props.illustrationFallback()}
						</CardMedia> :
						<Illustration
      					  	url={props.illustrationURL}
							onError={() => setImageNotFound(true) }
      					/>
					}
					</AspectRatio>
					<CardContent style={{ display:'flex', justifyContent:'center', alignItems: 'center', flexDirection: 'column' }}>
						<Typography sx={{ fontWeight: 'bold' }}>
							{props.title}
						</Typography>
						{ props.subtitle &&
							<Typography sx={{ fontWeight: 'light' }}>
								{props.subtitle}
							</Typography>
						}
					</CardContent>
				</CardActionArea>
			</Card>
		</Box>	
	)
}

export default Tile;