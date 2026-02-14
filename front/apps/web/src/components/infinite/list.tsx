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

import { Divider, List } from "@mui/material";
import { Fragment, type ReactNode } from "react";
import type { IllustratedResource } from "@/models/illustration";
import type Resource from "@/models/resource";
import { useGradientBackground } from "~/components/gradient-background";
import InfiniteScroll from "./scroll";

type TypedList<
	T extends Resource,
	F extends Resource = T,
> = typeof InfiniteScroll<T, F>;
type InfiniteListProps<T extends Resource, F extends Resource = T> = Omit<
	Parameters<TypedList<T, F>>[0],
	"render"
> & {
	render: (
		item: F | undefined,
		items: (F | undefined)[],
		index: number,
	) => ReactNode;
} & Partial<Pick<Parameters<TypedList<T, F>>[0], "emptyState">>;

/**
 * Similar to InfiniteGrid, but rendered as a list
 * @param props
 * @returns
 */
const InfiniteList = <T extends Resource, F extends IllustratedResource>(
	props: InfiniteListProps<T, F>,
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
						<List>
							{items.map((item, index) => (
								<Fragment
									key={
										item === undefined
											? `skeleton-${index}`
											: `item-${index}`
									}
								>
									{props.render(item, items, index)}
									{index === items.length - 1 || (
										<Divider variant="middle" />
									)}
								</Fragment>
							))}
						</List>
					</>
				);
			}}
		/>
	);
};

export default InfiniteList;
