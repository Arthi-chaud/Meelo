import {
	Box, Card, CardActionArea,
	CardContent, CardMedia, Typography
} from "@mui/material";
import Link from 'next/link';
import { CSSProperties, useState } from "react";

const titleStyle = {
	display: '-webkit-box',
	WebkitBoxOrient: 'vertical' as CSSProperties['WebkitBoxOrient']
};

type TileProps = {
	title: string,
	subtitle?: string
	thirdTitle?: string,
	illustration: JSX.Element,
	contextualMenu?: JSX.Element
	/**
	 * URL to push on tile tap
	 */
	href?: string;
	/**
	 * Callback on tile tap
	 */
	onClick?: () => void;
}

const Tile = (props: TileProps) => {
	const [isHovering, setIsHovering] = useState(false);
	const [isHoveringCtxtMenu, setIsHoveringCtxtMenu] = useState(false);

	const component =
		<Card sx={{ height: '100%' }} onMouseOver={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
			<CardActionArea onClick={props.onClick} disableRipple={isHoveringCtxtMenu} sx={{
				height: '100%', display: 'flex',
				flexDirection: 'column', alignItems: 'space-between'
			}}>
				{props.contextualMenu &&
					<Box style={{ position: 'absolute', top: '0', right: '0', zIndex: 2 }}
						hidden={!isHovering} onClick={(event) => event.preventDefault()}
						onMouseOver={() => setIsHoveringCtxtMenu(true)}
						onMouseLeave={() => setIsHoveringCtxtMenu(false)}
					>
						{props.contextualMenu}
					</Box>
				}
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
						sx={{ color: "text.disabled", textAlign: 'center' }}
						style={{ ...titleStyle, overflowWrap: 'anywhere', WebkitLineClamp: 1 }}
					>
						{props.subtitle}
					</Typography>
					}
				</CardContent>
			</CardActionArea>
		</Card>;

	if (props.href) {
		return <Link href={isHoveringCtxtMenu ? {} : props.href}>{component}</Link>;
	}
	return component;
};

export default Tile;
