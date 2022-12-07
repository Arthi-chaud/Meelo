import {
	Card, CardActionArea, CardContent, CardMedia, Typography
} from "@mui/material";
import { useTheme } from "@mui/system";
import Link from 'next/link';
import { CSSProperties } from "react";

const titleStyle = {
	display: '-webkit-box',
	WebkitBoxOrient: 'vertical' as CSSProperties['WebkitBoxOrient']
};

type TileProps = {
	title: string,
	subtitle?: string
	thirdTitle?: string,
	illustration: JSX.Element,
	/**
	 * URL to push on tile tap
	 */
	targetURL: string;
}

const Tile = (props: TileProps) => {
	const theme = useTheme();

	return (
		<Card style={{
			border: "none", boxShadow: "none", height: '100%',
			borderRadius: theme.shape.borderRadius
		}}>
			<Link href={props.targetURL}>
				<CardActionArea sx={{
					height: '100%', display: 'flex',
					flexDirection: 'column', alignItems: 'space-between'
				}}>
					<CardMedia sx={{ width: '100%' }}>
						{props.illustration}
					</CardMedia>
					<CardContent style={{
						flexDirection: 'column', display: 'flex', height: '100%',
						alignContent: 'center', justifyContent: 'center'
					}}>
						<Typography
							sx={{ fontWeight: 'bold', textAlign: 'center' }}
							style={{ ...titleStyle, overflowWrap: 'anywhere', WebkitLineClamp: 2 }}
						>
							{props.title}
						</Typography>
						{ props.subtitle &&
						<Typography
							sx={{ fontWeight: 'light', textAlign: 'center' }}
							style={{ ...titleStyle, overflowWrap: 'anywhere', WebkitLineClamp: 1 }}
						>
							{props.subtitle}
						</Typography>
						}
					</CardContent>
				</CardActionArea>
			</Link>
		</Card>
	);
};

export default Tile;
