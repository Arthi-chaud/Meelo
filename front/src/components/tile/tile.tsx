import {
	Box, Card, CardActionArea,
	CardContent, CardMedia, NoSsr, Typography, useTheme
} from "@mui/material";
import Link from 'next/link';
import { CSSProperties, useState } from "react";
import Fade from "../fade";
import hexToRgba from "hex-to-rgba";

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
	/* Additional props to customize card */
	cardProps?: Parameters<typeof Card>[0]
}

const Tile = (props: TileProps) => {
	const [isHovering, setIsHovering] = useState(false);
	const [isHoveringCtxtMenu, setIsHoveringCtxtMenu] = useState(false);
	const theme = useTheme();
	const component =
		<Card {...props.cardProps}
			sx={{
				height: '100%',
				background: hexToRgba('#ffffff', 0.05),
				backdropFilter: 'blur(10px)',
				...props.cardProps?.sx
			}}
			onMouseOver={() => setIsHovering(true)} onMouseLeave={() => {
				setIsHovering(false);
				setIsHoveringCtxtMenu(false);
			}}
		>
			<CardActionArea onClick={props.onClick} disableRipple={isHoveringCtxtMenu} sx={{
				height: '100%', display: 'flex',
				flexDirection: 'column', alignItems: 'space-between'
			}}>
				<NoSsr>
					{props.contextualMenu &&
						<Fade in={isHovering} style={{ position: 'absolute', top: '0', right: '0', zIndex: 2 }}
							hidden={!isHovering} onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							onTouchStart={() => setIsHoveringCtxtMenu(false)}
							onTouchEnd={() => setIsHoveringCtxtMenu(false)}
							onMouseOver={() => setIsHoveringCtxtMenu(true)}
							onMouseLeave={() => setIsHoveringCtxtMenu(false)}
							mountOnEnter
							unmountOnExit
						>
							<Box>{props.contextualMenu}</Box>
						</Fade>
					}
				</NoSsr>
				<CardMedia sx={{ width: '100%' }}>
					{props.illustration}
				</CardMedia>
				<CardContent style={{
					flexDirection: 'column', display: 'flex', height: '100%',
					alignContent: 'center', justifyContent: 'center'
				}}>
					<Typography
						sx={{ fontWeight: 'medium', textAlign: 'center' }}
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
