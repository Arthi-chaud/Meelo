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

import { Box, Button, Slide, Tooltip } from "@mui/material";
import { GoBackTopIcon } from "../icons";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { WideLoadingComponent } from "../loading/loading";
import InfiniteGrid from "./infinite-grid";
import InfiniteList from "./infinite-list";
import { useEffect, useState } from "react";
import Fade from "../fade";
import { useTranslation } from "react-i18next";
import { IllustratedResource } from "../../models/illustration";

export type InfiniteViewProps<ItemType> = {
	view: "list" | "grid";
	query: MeeloInfiniteQueryFn<ItemType>;
	renderListItem: (item: ItemType | undefined) => JSX.Element;
	renderGridItem: (item: ItemType | undefined) => JSX.Element;
};

/**
 * Infinite scrolling view, which lets the user decide which way the data is displayed
 * @returns
 */
const InfiniteView = <ItemType extends IllustratedResource>(
	props: InfiniteViewProps<ItemType>,
) => {
	const { t } = useTranslation();
	const [backToTopVisible, setBackToTopVisible] = useState(false);
	const handleScroll = () => {
		const position = window.scrollY;

		setBackToTopVisible(position > window.innerHeight);
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);
	return (
		<>
			<Slide
				direction="down"
				in={backToTopVisible}
				mountOnEnter
				unmountOnExit
			>
				<Tooltip title={t("backToTop")}>
					<Button
						variant="contained"
						color="secondary"
						sx={{
							zIndex: "tooltip",
							position: "fixed",
							top: 16,
							right: 16,
						}}
						onClick={() =>
							window.scrollTo({
								top: 0,
								left: 0,
								behavior: "smooth",
							})
						}
					>
						<GoBackTopIcon />
					</Button>
				</Tooltip>
			</Slide>
			{props.view.toLowerCase() == "list" ? (
				<InfiniteList
					loader={() => <WideLoadingComponent />}
					query={props.query}
					render={(item, index) => (
						<Fade in>
							<Box key={item?.id ?? `skeleton-${index}`}>
								{props.renderListItem(item)}
							</Box>
						</Fade>
					)}
				/>
			) : (
				<InfiniteGrid
					query={props.query}
					loader={() => <WideLoadingComponent />}
					render={(item) => (
						<Fade in>
							<Box sx={{ height: "100%" }}>
								{props.renderGridItem(item)}
							</Box>
						</Fade>
					)}
				/>
			)}
		</>
	);
};

export default InfiniteView;
