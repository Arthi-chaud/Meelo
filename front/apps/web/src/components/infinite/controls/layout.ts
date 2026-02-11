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
import { useLayoutControl as useLayoutControlBase } from "@/infinite-controls/layout";
import { type LayoutOption, LayoutOptions } from "@/models/layout";
import { useViewPreference } from "~/state/view-preferences";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

// Hook to get Layout data to pass to Controls
export const useLayoutControl = ({
	defaultLayout,
	enableToggle,
}: {
	defaultLayout: LayoutOption;
	enableToggle: boolean;
}) => {
	const router = useRouter();
	const [viewPreference, setViewPreference] = useViewPreference(router.route);
	return useLayoutControlBase({
		hook: () => {
			const router = useRouter();
			const layoutQuery = parseQueryParam(
				// biome-ignore lint/complexity/useLiteralKeys: Clarity
				router.query["view"],
				LayoutOptions,
			);
			return layoutQuery;
		},
		defaultLayout: viewPreference.layout?.layout ?? defaultLayout,
		defaultItemSize: viewPreference.layout?.itemSize,
		enableToggle,
		onUpdate: (p) => {
			setQueryParam([["view", p.layout]], router);
			setViewPreference((vp) => {
				vp.layout = p;
				return vp;
			});
		},
	});
};
