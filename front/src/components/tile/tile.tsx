import {Box, Card, CardActionArea, CardContent, CardMedia, IconButton, Typography} from "@mui/material";
import {useState} from "react";
import Illustration from '../illustration';
import Link from 'next/link';

type TileProps = {
	title: string,
	subtitle?: string
	thirdTitle?: string,
	illustration: JSX.Element,
	/**
	 * URL to push on tile tap
	 */
	targetURL: string
}

const Tile = (props: TileProps) => {
	return (
		<Box sx={{ height: '100%' }}>
			<Card style={{ border: "none", boxShadow: "none", borderRadius: '3%' }}>
				<CardActionArea>
					<Link href={props.targetURL}>
						<Box>
							<CardMedia> 
								{props.illustration}
							</CardMedia>
							<CardContent style={{ display:'flex', justifyContent:'center', alignItems: 'center', flexDirection: 'column' }}>
								<Typography sx={{ fontWeight: 'bold', textAlign: 'center' }}>
									{props.title}
								</Typography>
								{ props.subtitle &&
									<Typography sx={{ fontWeight: 'light', textAlign: 'center' }}>
										{props.subtitle}
									</Typography>
								}
							</CardContent>
						</Box>
					</Link>
				</CardActionArea>
			</Card>
		</Box>	
	)
}

export default Tile;