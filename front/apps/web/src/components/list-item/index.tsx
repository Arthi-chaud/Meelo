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
	Grid,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	ListItem as MUIListItem,
	Skeleton,
	Typography,
	useTheme,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

type ListItemProps = {
	icon?: ReactNode;
	title: string | undefined;
	secondTitle: string | undefined | null;
	trailing?: ReactNode;
	href?: string;
	onClick?: () => void;
	iconIsThumbnail?: boolean;
};

const textStyle = {
	whiteSpace: "nowrap",
	textAlign: "left",
};

const primaryTextStyle = {
	fontWeight: "medium",
};

const secondaryTextStyle = {
	color: "text.disabled",
};

const ListItem = (props: ListItemProps) => {
	const _theme = useTheme();

	return (
		<MUIListItem
			disablePadding
			sx={{
				// Unhover button when we hover trailing
				"& .parent:has(.secondaryItem:hover):hover": {
					backgroundColor: "transparent",
				},
				// Unfocus button when we focus trailing
				"& .parent:has(.secondaryItem:focus-within):focus-within": {
					backgroundColor: "transparent",
				},
				// Unfocus button when we click on ctxt menu
				"& .parent:has(.secondaryItem:focus):focus": {
					backgroundColor: "transparent",
				},
			}}
		>
			<ListItemButton
				{...{
					className: "parent",
					onClick: props.onClick,
					sx: {
						paddingX: 1,
					},
					component: props.href ? Link : undefined,
					href: props.href,
				}}
			>
				<ListItemAvatar
					sx={{
						marginRight: 2,
						aspectRatio: props.iconIsThumbnail ? 16 / 9 : undefined,
						minWidth: props.iconIsThumbnail ? "90px" : undefined,
					}}
				>
					{props.icon}
				</ListItemAvatar>
				<Box
					sx={{
						display: { xs: "grid", xl: "none" },
						width: "100%",
					}}
				>
					<ListItemText
						primary={props.title ?? <Skeleton width={"120px"} />}
						slotProps={{
							primary: primaryTextStyle,
							secondary: secondaryTextStyle,
						}}
						secondary={
							props.secondTitle === undefined ? (
								<Skeleton width={"70px"} />
							) : (
								props.secondTitle
							)
						}
					/>
				</Box>
				<Grid
					paddingRight={8}
					container
					spacing={2}
					sx={{ display: { xs: "none", xl: "flex" }, width: "100%" }}
				>
					<Grid size={{ xs: props.secondTitle !== null ? 6 : 10 }}>
						<Typography sx={{ ...textStyle, ...primaryTextStyle }}>
							{props.title ?? <Skeleton width={"120px"} />}
						</Typography>
					</Grid>
					{props.secondTitle === null ? undefined : (
						<Grid
							size={{ xs: 6 }}
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							<Typography
								sx={{ ...textStyle, ...secondaryTextStyle }}
							>
								{props.secondTitle ?? (
									<Skeleton width={"70px"} />
								)}
							</Typography>
						</Grid>
					)}
				</Grid>
				{props.trailing && (
					<Box
						className="secondaryItem"
						sx={{
							paddingLeft: 1,
							display: "flex",
							justifyContent: "right",
						}}
						// Prevent .parent to ripple on click
						onMouseDown={(e) => e.stopPropagation()}
						onTouchEnd={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
						onClick={(e) => {
							// Prevent .parent callback to fire on click
							e.stopPropagation();
							// Prevent parent href to be used
							e.preventDefault();
						}}
					>
						{props.trailing}
					</Box>
				)}
			</ListItemButton>
		</MUIListItem>
	);
};

export default ListItem;
