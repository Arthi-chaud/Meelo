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
	CardContent,
	CardMedia,
	Link as MUILink,
	Typography,
	useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Link from "next/link";
import { RequireAllOrNone } from "type-fest";

const PREFIX = "Tile";

const classes = {
	parent: `${PREFIX}-parent`,
	textDiv: `${PREFIX}-textDiv`,
	primaryText: `${PREFIX}-primaryText`,
	ctxtMenuContainer: `${PREFIX}-ctxtMenuContainer`,
};

const StyledCard = styled(Card)({
	[`& .${classes.parent}`]: {
		display: "flex",
		"&:hover": {
			[`& .${classes.textDiv}`]: {
				width: "80%",
			},
			[`& .${classes.primaryText}`]: {
				width: "90%",
			},
			[`& .${classes.ctxtMenuContainer}`]: {
				display: "flex",
			},
		},
	},
	[`& .${classes.textDiv}`]: {
		width: "100%",
	},
	[`& .${classes.primaryText}`]: {
		width: "100%",
	},
	[`& .${classes.ctxtMenuContainer}`]: {
		width: "20%",
		display: "none",
	},
});

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
	const theme = useTheme();
	const contextualMenu = props.contextualMenu;
	const component = (
		<StyledCard
			{...props.cardProps}
			sx={{
				overflow: "visible",
				boxShadow: "none",
				background: "none",
				...props.cardProps?.sx,
			}}
		>
			<CardMedia
				onClick={props.onClick}
				sx={{
					width: "100%",
					cursor: "pointer",
					":hover": { transform: "scale(1.04)" },
					transition: "transform 0.2s",
				}}
			>
				{props.href ? (
					<Link href={props.href}>{props.illustration}</Link>
				) : (
					props.illustration
				)}
			</CardMedia>
			<CardContent
				sx={{
					height: "100%",
					width: "100%",
					padding: 1,
					justifyContent: "space-between",
				}}
				className={classes.parent}
			>
				<Box
					className={classes.textDiv}
					sx={{
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Typography
						onClick={props.onClick}
						variant="body1"
						className={classes.primaryText}
						sx={{
							transition: "width .3s",
							width: "100%",
							fontWeight: "medium",
							":hover": { textDecoration: "underline" },
							textAlign: props.subtitle ? "left" : "center",
							// To prevent shift caused by ctxt menu
							paddingY: props.subtitle ? 0 : 1,
							cursor: props.onClick ? "pointer" : undefined,
						}}
						style={{ ...titleStyle }}
					>
						{props.href ? (
							<MUILink
								component={Link}
								underline="hover"
								href={props.href}
							>
								{props.title}
							</MUILink>
						) : (
							props.title
						)}
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
							{props.secondaryHref ? (
								<MUILink
									component={Link}
									underline="hover"
									color={"inherit"}
									href={props.secondaryHref}
								>
									{props.subtitle}
								</MUILink>
							) : (
								props.subtitle
							)}
						</Typography>
					)}
				</Box>
				<Box
					className={classes.ctxtMenuContainer}
					sx={{
						alignItems: "center",
						justifyContent: "end",
					}}
				>
					{contextualMenu}
				</Box>
			</CardContent>
		</StyledCard>
	);

	return component;
};

export default Tile;
