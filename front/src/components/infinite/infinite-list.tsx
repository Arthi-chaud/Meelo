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
import { CSSProperties, Fragment, ReactNode, forwardRef } from "react";
import { IllustratedResource } from "../../models/illustration";
import { useGradientBackground } from "../../utils/gradient-background";

type TypedList<T extends Resource> = typeof InfiniteScroll<T>;
type InfiniteListProps<T extends Resource> = Omit<
	Parameters<TypedList<T>>[0],
	"render" | "parentDiv"
> & { render: (item: T | undefined, index: number) => JSX.Element };

/**
 * Similar to InfiniteGrid, but rendered as a list
 * @param props
 * @returns
 */
const InfiniteList = <T extends IllustratedResource>(
	props: InfiniteListProps<T>,
) => {
	const parentDiv =
		// eslint-disable-next-line react/display-name
		forwardRef<
			HTMLDivElement,
			{
				children?: ReactNode;
				firstPage?: T[];
				style?: CSSProperties;
			}
		>(({ children, firstPage, style }, ref) => {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const { GradientBackground } = useGradientBackground(
				firstPage?.find((x) => x.illustration)?.illustration?.colors,
			);
			return (
				<>
					<GradientBackground />
					<List
						style={{ padding: 0, ...style, margin: 0 }}
						component="div"
						ref={ref}
					>
						{children}
					</List>
				</>
			);
		});
	return (
		<InfiniteScroll
			{...props}
			parentDiv={parentDiv}
			render={(item, index) => {
				return (
					<Fragment key={`item-${index}`}>
						{props.render(item, index)}
						<Divider variant="middle" />
					</Fragment>
				);
			}}
		/>
	);
};

export default InfiniteList;
