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
	BottomNavigationAction,
	Box,
	Container,
	Divider,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	BottomNavigation as MUIBottomNavigation,
	Drawer as MUIDrawer,
	Typography,
	useTheme,
} from "@mui/material";
import { deepmerge } from "@mui/utils";
import {
	AlbumIcon,
	ArtistIcon,
	BurgerIcon,
	PlaylistIcon,
	SongIcon,
	VideoIcon,
} from "../icons";
import Link from "next/link";
import Translate from "../../i18n/translate";
import Player from "../player/player";
import { useRouter } from "next/router";
import { IconProps } from "iconsax-react";
import { useState } from "react";
import scaffoldActions from "./actions";
import type {} from "@mui/material/themeCssVarsAugmentation";
import ThemedImage from "../../utils/themed-image";

/**
 * Array of possible item types
 */
const primaryItems = [
	"artists",
	"albums",
	"songs",
	"videos",
	"playlists",
] as const;
const getPrimaryTypeIcon = (
	type: (typeof primaryItems)[number],
	props?: IconProps,
) => {
	switch (type) {
		case "albums":
			return <AlbumIcon {...props} />;
		case "artists":
			return <ArtistIcon {...props} />;
		case "songs":
			return <SongIcon {...props} />;
		case "videos":
			return <VideoIcon {...props} />;
		case "playlists":
			return <PlaylistIcon {...props} />;
	}
};

export const DrawerBreakpoint = "md" as const;

const Drawer = ({
	openBottomDrawer,
	onClose,
}: {
	openBottomDrawer: boolean;
	onClose: () => void;
}) => {
	const router = useRouter();
	const theme = useTheme();
	const persistentDrawerBreakpoint = DrawerBreakpoint;
	const drawerWidth = { [persistentDrawerBreakpoint]: 240 };
	const actions = scaffoldActions;
	const commonDrawerProps = {
		anchor: "left",
		onClose: onClose,
		sx: {
			zIndex: "tooltip",
			"& .MuiDrawer-paper": {
				width: drawerWidth,
				backdropFilter: "blur(30px)",
				boxSizing: "border-box",
			},
		},
	} as const;
	const persistentDrawerProps = {
		open: true,
		variant: "permanent",
		sx: {
			display: {
				xs: "none",
				[persistentDrawerBreakpoint]: "block",
			},
			width: drawerWidth,
			"& .MuiDrawer-paper": {
				backgroundColor: "transparent",
			},
		},
	} as const;
	const temporaryDrawerProps = {
		open: openBottomDrawer,
		variant: "temporary",
		sx: {
			display: {
				xs: "block",
				[persistentDrawerBreakpoint]: "none",
			},
			width: "auto",
			"& .MuiDrawer-paper": {
				[theme.getColorSchemeSelector("dark")]: {
					backgroundColor: "transparent",
				},
			},
		},
	} as const;

	return (
		<>
			{[persistentDrawerProps, temporaryDrawerProps].map(
				(drawerProps) => (
					<MUIDrawer
						key={`drawer-${drawerProps.variant}`}
						{...deepmerge(drawerProps, commonDrawerProps)}
					>
						<Box
							sx={{
								justifyContent: "center",
								display: "flex",
								alignItems: "center",
								padding: 2,
							}}
						>
							<Link href="/" style={{ cursor: "pointer" }}>
								<ThemedImage
									light={"/banner-black.png"}
									dark={"/banner.png"}
									alt="icon"
									priority
									width={180}
									height={75}
								/>
							</Link>
						</Box>
						<Divider variant="middle" />
						<List>
							{primaryItems.map((item) => {
								const path = `/${item}`;
								const isSelected = path == router.asPath;
								const Icon = (props: IconProps) =>
									getPrimaryTypeIcon(item, props);

								return (
									<ListItem key={item}>
										<Link
											href={path}
											style={{ width: "100%" }}
										>
											<ListItemButton onClick={onClose}>
												<ListItemIcon>
													<Icon
														variant={
															isSelected
																? "Bold"
																: "Outline"
														}
													/>
												</ListItemIcon>
												<ListItemText>
													<Typography
														sx={{
															fontWeight:
																isSelected
																	? "bold"
																	: "normal",
														}}
													>
														<Translate
															translationKey={
																item
															}
														/>
													</Typography>
												</ListItemText>
											</ListItemButton>
										</Link>
									</ListItem>
								);
							})}
						</List>
						<Divider variant="middle" />
						<List>
							{actions.map((action) => {
								const path = action.href;
								const isSelected = path
									? path !== "/"
										? router.asPath.startsWith(path)
										: false
									: false;
								let item = (
									<ListItemButton
										onClick={() => {
											action.onClick && action.onClick();
											onClose();
										}}
									>
										<ListItemIcon>
											{action.icon}
										</ListItemIcon>
										<ListItemText
											primary={
												<Typography
													sx={{
														fontWeight: isSelected
															? "bold"
															: "normal",
													}}
												>
													<Translate
														translationKey={
															action.label
														}
													/>
												</Typography>
											}
										></ListItemText>
									</ListItemButton>
								);

								if (action.href) {
									item = (
										<Link
											href={action.href}
											style={{ width: "100%" }}
										>
											{item}
										</Link>
									);
								}
								return (
									<ListItem key={action.label}>
										{item}
									</ListItem>
								);
							})}
						</List>
					</MUIDrawer>
				),
			)}
		</>
	);
};

const BottomNavigation = (props: { onDrawerOpen: () => void }) => {
	const router = useRouter();
	const theme = useTheme();

	return (
		<MUIBottomNavigation
			showLabels
			value={router.asPath}
			sx={{
				boxShadow: 10,
				zIndex: "modal",
				width: "100%",
				padding: 1,
				position: "fixed",
				justifyContent: "space-evenly",
				bottom: 0,
				backgroundColor: `rgba(
					${theme.vars.palette.background.defaultChannel} / 0.65)`,
				backdropFilter: "blur(40px)",
				display: { xs: "flex", [DrawerBreakpoint]: "none" },
			}}
		>
			{primaryItems.slice(0, 3).map((item) => {
				const path = `/${item}`;
				const isSelected = path == router.asPath;
				const Icon = (pr: IconProps) => getPrimaryTypeIcon(item, pr);

				return (
					<Link
						key={path}
						href={path}
						style={{
							flex: 1,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<BottomNavigationAction
							key={item}
							showLabel
							icon={
								<Icon
									variant={isSelected ? "Bold" : "Outline"}
								/>
							}
							label={<Translate translationKey={item} />}
						/>
					</Link>
				);
			})}
			<BottomNavigationAction
				showLabel
				sx={{ flex: 1 }}
				icon={<BurgerIcon />}
				onClick={props.onDrawerOpen}
				label={<Translate translationKey={"more"} />}
			/>
		</MUIBottomNavigation>
	);
};

const Scaffold = (props: { children: any }) => {
	const [tempDrawerIsOpen, openDrawer] = useState(false);

	return (
		<Box sx={{ display: "flex", width: "100%", height: "100vh" }}>
			<Drawer
				openBottomDrawer={tempDrawerIsOpen}
				onClose={() => openDrawer(false)}
			/>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					flexWrap: "nowrap",
					overflowX: "clip",
					width: "100%",
				}}
			>
				<Container
					maxWidth={false}
					sx={{
						paddingTop: 2,
						paddingBottom: { xs: "65px", [DrawerBreakpoint]: 2 },
					}}
				>
					{props.children}
				</Container>
				<Box sx={{ height: "100%" }} />
				<Player />
			</Box>
			<BottomNavigation
				onDrawerOpen={() => {
					openDrawer(!tempDrawerIsOpen);
				}}
			/>
		</Box>
	);
};

export default Scaffold;
