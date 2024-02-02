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
import { RequireExactlyOne } from "type-fest";
import Link from "next/link";

type ListItemProps = {
	icon?: JSX.Element;
	title: string | undefined;
	secondTitle: string | undefined | null;
	trailing?: JSX.Element;
} & RequireExactlyOne<{
	href: string | undefined;
	onClick: (() => void) | undefined;
}>;

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
	const theme = useTheme();

	return (
		<MUIListItem disablePadding secondaryAction={props.trailing}>
			<ListItemButton
				{...{
					onClick: props.onClick,
					sx: { paddingX: 1 },
					component: props.href ? Link : undefined,
					href: props.href,
				}}
			>
				<ListItemAvatar sx={{ marginRight: 2 }}>
					{props.icon}
				</ListItemAvatar>
				<Box
					sx={{
						display: { xs: "grid", xl: "none" },
						width: props.title === undefined ? "100%" : undefined,
					}}
				>
					<ListItemText
						primary={props.title ?? <Skeleton />}
						primaryTypographyProps={primaryTextStyle}
						secondary={
							props.secondTitle === undefined ? (
								<Skeleton width={"70%"} />
							) : (
								props.secondTitle
							)
						}
						secondaryTypographyProps={secondaryTextStyle}
					/>
				</Box>
				<Grid
					paddingRight={8}
					container
					spacing={2}
					sx={{ display: { xs: "none", xl: "flex" }, width: "100%" }}
				>
					<Grid item xs={props.secondTitle ? 6 : 10}>
						<Typography sx={{ ...textStyle, ...primaryTextStyle }}>
							{props.title ?? <Skeleton />}
						</Typography>
					</Grid>
					{props.secondTitle === null ? undefined : (
						<Grid
							item
							xs={6}
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							<Typography
								sx={{ ...textStyle, ...secondaryTextStyle }}
							>
								{props.secondTitle ?? (
									<Skeleton width={"70%"} />
								)}
							</Typography>
						</Grid>
					)}
				</Grid>
			</ListItemButton>
		</MUIListItem>
	);
};

export default ListItem;
