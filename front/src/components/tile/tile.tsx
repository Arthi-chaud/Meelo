import {
	Box, Card, CardActionArea,
	CardContent, CardMedia, Grid, NoSsr, Typography, useTheme
} from "@mui/material";
import Link from 'next/link';
import { useState } from "react";
import Fade from "../fade";
import { RequireAllOrNone } from "type-fest";

const titleStyle = {
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	overflow: 'hidden'
} as const;

type TileProps = {
	title: string,
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
} & RequireAllOrNone<{
	subtitle: string
	/**
	 * URL to push on secondary tile tap
	 */
	secondaryHref?: string;
}>

const linkStyle = {
	'a': {
		background: 'linear-gradient(to right, rgba(100, 200, 200, 1), rgba(100, 200, 200, 1)),linear-gradient(to right, rgba(255, 0, 0, 1), rgba(255, 0, 180, 1), rgba(0, 100, 200, 1))',
		backgroundSize: '100% 0.1em, 0 0.1em',
		backgroundPosition: '100% 100%, 0 100%',
		backgroundRepeat: 'no-repeat',
		transition: 'background-size 400ms'
	},
	'a:hover': {
		backgroundSize: '0 0.1em, 100% 0.1em'
	},
	'a:focus': {
		backgroundSize: '0 0.1em, 100% 0.1em'
	}
};

const Tile = (props: TileProps) => {
	const [isHovering, setIsHovering] = useState(false);
	const [isHoveringCtxtMenu, setIsHoveringCtxtMenu] = useState(false);
	const theme = useTheme();
	const contextualMenu = <NoSsr>
		{props.contextualMenu &&
			<Fade in={isHovering} style={{ zIndex: 2 }}
				hidden={!isHovering}
				onClick={(event) => {
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
	</NoSsr>;
	const component =
		<Card {...props.cardProps}
			sx={{
				height: '100%',
				boxShadow: 'none',
				background: 'none',
				backdropFilter: 'blur(10px)',
				...props.cardProps?.sx
			}}
		>
			<CardActionArea onClick={props.onClick} disableRipple={isHoveringCtxtMenu} sx={{
				height: '100%', display: 'flex',
				flexDirection: 'column', alignItems: 'space-between'
			}}>
				<CardMedia sx={{ width: '100%' }}>
					{ props.href
						? <Link href={props.href}>{props.illustration}</Link>
						: props.illustration
					}
				</CardMedia>
				<CardContent
					onMouseOver={() => setIsHovering(true)}
					onMouseLeave={() => setIsHovering(false)}
					sx={{
						height: '100%', width: '100%',
						padding: 1,
					}}
				>
					<Grid container sx={{ justifyContent: 'space-between' }}>
						<Grid item xs={isHovering ? 10 : undefined} sx={{ width: '100%' }}>
							<Box sx={{
								display: 'flex',
								flexDirection: 'column',
								width: '100%'
							}}>
								<Typography
									variant='body1'
									sx={{
										transition: 'width .3s',
										width: isHovering ? '90%' : '100%',
										fontWeight: 'medium',
										textAlign: props.subtitle ? 'left' : 'center',
										// To prevent shift caused by ctxt menu
										paddingY: props.subtitle ? 0 : 1
									}}
									style={{ ...titleStyle }}
								>
									{ props.href
										? <Link href={props.href}>{props.title}</Link>
										: props.title
									}
								</Typography>
								{props.subtitle &&
								<Typography
									variant='body2'
									sx={{ color: "text.disabled", textAlign: 'left' }}
									style={titleStyle}
								>
									{ props.secondaryHref
										? <Link href={props.secondaryHref}>{props.subtitle}</Link>
										: props.subtitle
									}
								</Typography>}
							</Box>
						</Grid>
						<Grid item xs={isHovering ? 2 : 0} sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'end'
						}}>
							{contextualMenu}
						</Grid>
					</Grid>
				</CardContent>
			</CardActionArea>
		</Card>;

	return component;
};

export default Tile;
