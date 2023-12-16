/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	CardMedia,
	Grid,
	Link as MUILink,
	NoSsr,
	Typography,
	useTheme,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import Fade from "../fade";
import { RequireAllOrNone } from "type-fest";

const titleStyle = {
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	overflow: "hidden",
} as const;

type TileProps = {
	title: string;
	illustration: JSX.Element;
	contextualMenu?: JSX.Element;
	/**
	 * URL to push on tile tap
	 */
	href?: string;
	/**
	 * Callback on tile tap
	 */
	onClick?: () => void;
	/* Additional props to customize card */
	cardProps?: Parameters<typeof Card>[0];
} & RequireAllOrNone<{
	subtitle?: string;
	/**
	 * URL to push on secondary tile tap
	 */
	secondaryHref?: string;
}>;

const Tile = (props: TileProps) => {
	const [isHovering, setIsHovering] = useState(false);
	const [isHoveringCtxtMenu, setIsHoveringCtxtMenu] = useState(false);
	const theme = useTheme();
	const contextualMenu = (
		<NoSsr>
			{props.contextualMenu && (
				<Fade
					in={isHovering}
					style={{ zIndex: 2 }}
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
			)}
		</NoSsr>
	);
	const component = (
		<Card
			{...props.cardProps}
			sx={{
				boxShadow: "none",
				background: "none",
				backdropFilter: "blur(10px)",
				...props.cardProps?.sx,
			}}
		>
			<CardActionArea
				onClick={props.onClick}
				disableRipple={isHoveringCtxtMenu}
				sx={{
					height: "100%",
					width: "100%",
					display: "flex",
				}}
			>
				<CardMedia sx={{ width: "100%" }}>
					{props.href ?
						<Link href={props.href}>{props.illustration}</Link>
					:	props.illustration}
				</CardMedia>
			</CardActionArea>
			<CardContent
				onMouseOver={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
				sx={{
					height: "100%",
					width: "100%",
					padding: 1,
				}}
			>
				<Grid container sx={{ justifyContent: "space-between" }}>
					<Grid
						item
						xs={isHovering ? 10 : undefined}
						sx={{ width: "100%" }}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								width: "100%",
							}}
						>
							<Typography
								onClick={props.onClick}
								variant="body1"
								sx={{
									transition: "width .3s",
									width: isHovering ? "90%" : "100%",
									fontWeight: "medium",
									textAlign:
										props.subtitle ? "left" : "center",
									// To prevent shift caused by ctxt menu
									paddingY: props.subtitle ? 0 : 1,
									cursor:
										props.onClick ? "pointer" : undefined,
								}}
								style={{ ...titleStyle }}
							>
								{props.href ?
									<MUILink
										component={Link}
										underline="hover"
										href={props.href}
									>
										{props.title}
									</MUILink>
								:	props.title}
							</Typography>
							{props.subtitle && (
								<Typography
									variant="body2"
									sx={{
										color: "text.disabled",
										textAlign: "left",
									}}
									style={titleStyle}
								>
									{props.secondaryHref ?
										<MUILink
											component={Link}
											underline="hover"
											color={"inherit"}
											href={props.secondaryHref}
										>
											{props.subtitle}
										</MUILink>
									:	props.subtitle}
								</Typography>
							)}
						</Box>
					</Grid>
					<Grid
						item
						xs={isHovering ? 2 : 0}
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "end",
						}}
					>
						{contextualMenu}
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	);

	return component;
};

export default Tile;
