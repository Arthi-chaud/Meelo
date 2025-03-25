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

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
	type ItemSize,
	type LayoutOption,
	LayoutOptions,
} from "../../../utils/layout";
import { parseQueryParam, setQueryParam } from "../../../utils/query-param";

export type LayoutControl =
	| { layout: "list"; itemSize: never; enableToggle: false; onUpdate: never }
	| {
			layout: "grid";
			itemSize: ItemSize;
			enableToggle: false;
			onUpdate: (p: { itemSize: ItemSize }) => void;
	  }
	| {
			layout: LayoutOption;
			enableToggle: true;
			itemSize: ItemSize;
			onUpdate: (p: {
				layout: LayoutOption;
				itemSize: ItemSize;
			}) => void;
	  };

// Hook to get Layout data to pass to Controls
export const useLayoutControl = ({
	defaultLayout,
	enableToggle,
}: {
	defaultLayout: LayoutOption;
	enableToggle: boolean;
}) => {
	// TODO Check layout update does not trigger infinite loop
	const router = useRouter();
	// biome-ignore lint/complexity/useLiteralKeys: Clarity
	const layoutQuery = parseQueryParam(router.query["view"], LayoutOptions);
	const [layoutState, setLayoutState] = useState<{
		layout: LayoutOption;
		itemSize: ItemSize;
	}>({
		layout: enableToggle ? defaultLayout : (layoutQuery ?? defaultLayout),
		itemSize: "xs",
	});
	const control: LayoutControl = {
		layout: layoutState.layout,
		enableToggle: enableToggle as true,
		itemSize: layoutState.itemSize,
		onUpdate: (p) => {
			setLayoutState(p);
		},
	};
	useEffect(() => {
		setQueryParam("view", layoutState.layout, router);
	}, [layoutState.layout]);
	return [layoutState, setLayoutState, control] as const;
};
