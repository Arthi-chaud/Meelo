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
import Resource from "../../models/resource";
import InfiniteScroll from "./infinite-scroll";
import { Fragment } from "react";
import GradientBackground from "../gradient-background";
import { IllustratedResource } from "../../models/illustration";

type TypedList<T extends Resource> = typeof InfiniteScroll<T>;
type InfiniteListProps<T extends Resource> = Omit<
	Parameters<TypedList<T>>[0],
	"render"
> & { render: (item: T | undefined, index: number) => JSX.Element };

/**
 * Similar to InfiniteGrid, but rendered as a list
 * @param props
 * @returns
 */
const InfiniteList = <T extends IllustratedResource>(
	props: InfiniteListProps<T>,
) => {
	return (
		<InfiniteScroll
			{...props}
			render={(items: (T | undefined)[]) => (
				<>
					<GradientBackground
						colors={
							items.find(
								(item) => item?.illustration !== undefined,
							)?.illustration?.colors
						}
						index={-1}
					/>
					<List>
						{items.map((item, index) => (
							<Fragment key={`item-${index}`}>
								{props.render(item, index)}
								{index == items.length - 1 || (
									<Divider variant="middle" />
								)}
							</Fragment>
						))}
					</List>
				</>
			)}
		/>
	);
};

export default InfiniteList;
