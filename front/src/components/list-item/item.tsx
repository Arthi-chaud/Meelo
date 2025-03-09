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
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import Link from "next/link";

type ListItemProps = {
	icon?: JSX.Element;
	title: string | undefined;
	titleIcon?: JSX.Element;
	secondTitle: string | undefined | null;
	trailing?: JSX.Element;
	href?: string;
	onClick?: () => void;
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

	const makeTitleElement = () => {
		if (props.title === undefined) {
			return <Skeleton width={"120px"} />;
		}

		return (
			<Stack direction="row" spacing={0.5} alignItems="center">
				{props.titleIcon}
				{props.title}
			</Stack>
		);
	};

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
						primary={makeTitleElement()}
						primaryTypographyProps={{
							...primaryTextStyle,
							component: "div"
						}}
						secondary={
							props.secondTitle === undefined ? (
								<Skeleton width={"70px"} />
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
					<Grid item xs={props.secondTitle !== null ? 6 : 10}>
						<Typography sx={{ ...textStyle, ...primaryTextStyle }} component="div">
							{makeTitleElement()}
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
									<Skeleton width={"70px"} />
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
