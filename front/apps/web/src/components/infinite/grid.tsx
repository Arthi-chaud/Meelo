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

import { type Breakpoint, Grid } from "@mui/material";
import type { ReactNode } from "react";
import type { IllustratedResource } from "@/models/illustration";
import type { ItemSize } from "@/models/layout";
import type Resource from "@/models/resource";
import { useGradientBackground } from "~/components/gradient-background";
import InfiniteScroll from "./scroll";

type TypedList<
	T extends Resource,
	F extends Resource = T,
> = typeof InfiniteScroll<T, F>;
type InfiniteGridProps<T extends Resource, F extends Resource> = Omit<
	Parameters<TypedList<T, F>>[0],
	"render"
> & {
	render: (
		item: F | undefined,
		items: (F | undefined)[],
		index: number,
	) => ReactNode;
	itemSize: ItemSize;
};

const GridPresets: Record<ItemSize, Partial<Record<Breakpoint, number>>> = {
	// Note: values of sm == values of md,
	// because of navbar reducing the actual sufrace of md
	xs: { xs: 12 / 5, sm: 2, md: 12 / 8, lg: 12 / 10, xl: 1 },
	s: { xs: 3, sm: 12 / 5, md: 12 / 5, lg: 12 / 8, xl: 12 / 10 },
	m: { xs: 4, sm: 3, md: 3, lg: 2, xl: 12 / 8 },
	l: { xs: 6, sm: 4, md: 4, lg: 12 / 5, xl: 12 / 6 },
	xl: { xs: 12, sm: 6, md: 6, lg: 12 / 4, xl: 12 / 5 },
};

/**
 * Infinite Scrolling List
 * @param props
 * @returns
 */
const InfiniteGrid = <T extends Resource, F extends IllustratedResource>(
	props: InfiniteGridProps<T, F>,
) => {
	return (
		<InfiniteScroll
			{...props}
			render={(items) => {
				const { GradientBackground } = useGradientBackground(
					items.find((item) => item?.illustration !== undefined)
						?.illustration?.colors,
					-1,
				);
				return (
					<>
						<GradientBackground />
						<Grid
							columnSpacing={
								["xs", "s"].includes(props.itemSize) ? 1.5 : 2
							}
							container
							sx={{ alignItems: "stretch", display: "flex" }}
						>
							{items.map((item, index) => (
								<Grid
									size={GridPresets[props.itemSize]}
									key={
										item === undefined
											? `skeleton-${index}`
											: `item-${index}`
									}
								>
									{props.render(item, items, index)}
								</Grid>
							))}
						</Grid>
					</>
				);
			}}
		/>
	);
};

export default InfiniteGrid;
