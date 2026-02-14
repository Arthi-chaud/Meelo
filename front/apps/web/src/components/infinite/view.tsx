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
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { InfiniteQueryFn } from "@/api/query";
import type { IllustratedResource } from "@/models/illustration";
import type { ItemSize } from "@/models/layout";
import type Resource from "@/models/resource";
import { GoBackTopIcon } from "@/ui/icons";
import { ParentScrollableDivId } from "@/utils/constants";
import type { EmptyStateProps } from "~/components/empty-state";
import Fade from "~/components/fade";
import InfiniteGrid from "./grid";
import InfiniteList from "./list";

export type InfiniteViewProps<
	ItemType extends Resource,
	FinalItemType extends Resource,
> = {
	view: "list" | "grid";
	itemSize: ItemSize;
	query: InfiniteQueryFn<ItemType, FinalItemType>;
	renderListItem: (
		item: FinalItemType | undefined,
		items: (FinalItemType | undefined)[],
		index: number,
	) => ReactNode;
	renderGridItem: (
		item: FinalItemType | undefined,
		items: (FinalItemType | undefined)[],
		index: number,
	) => ReactNode;
	emptyState?: Partial<EmptyStateProps>;
};

const ScrollToTopButton = () => {
	const { t } = useTranslation();
	const [backToTopVisible, setBackToTopVisible] = useState(false);
	const handleScroll = () => {
		const position = document.getElementById(
			ParentScrollableDivId,
		)?.scrollTop;

		setBackToTopVisible((position ?? 0) > window.innerHeight);
	};

	useEffect(() => {
		const elem = document.getElementById(ParentScrollableDivId);
		elem?.addEventListener("scroll", handleScroll, { passive: true });
		return () => elem?.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<Slide direction="down" in={backToTopVisible}>
			<Tooltip title={t("browsing.controls.backToTop")}>
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
						document
							.getElementById(ParentScrollableDivId)
							?.scrollTo({
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
	);
};

/**
 * Infinite scrolling view, which lets the user decide which way the data is displayed
 * @returns
 */
const InfiniteView = <
	ItemType extends Resource,
	FinalItemType extends IllustratedResource,
>(
	props: InfiniteViewProps<ItemType, FinalItemType>,
) => {
	return (
		<>
			<ScrollToTopButton />
			{props.view.toLowerCase() === "list" ? (
				<InfiniteList
					query={props.query}
					render={(item, items, index) => (
						<Fade in>
							<Box key={item?.id ?? `skeleton-${index}`}>
								{props.renderListItem(item, items, index)}
							</Box>
						</Fade>
					)}
				/>
			) : (
				<InfiniteGrid
					query={props.query}
					itemSize={props.itemSize}
					render={(item, items, index) => (
						<Fade in>
							<Box sx={{ height: "100%" }}>
								{props.renderGridItem(item, items, index)}
							</Box>
						</Fade>
					)}
				/>
			)}
		</>
	);
};

export default InfiniteView;
