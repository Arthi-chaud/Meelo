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

import { useRoute } from "@react-navigation/native";
import { useLayoutControl as useLayoutControlBase } from "@/infinite-controls/layout";
import type { LayoutOption } from "@/models/layout";
import { useViewPreference } from "~/state/view-preferences";

// Hook to get Layout data to pass to Controls
export const useLayoutControl = ({
	defaultLayout,
	enableToggle,
}: {
	defaultLayout: LayoutOption;
	enableToggle: boolean;
}) => {
	const route = useRoute();
	const [_, setPrefs] = useViewPreference(route.name);
	return useLayoutControlBase({
		hook: () => {
			const route = useRoute();
			const [{ layout }] = useViewPreference(route.name);
			return layout?.layout ?? null;
		},
		defaultLayout,
		enableToggle,
		onUpdate: (layout) => {
			setPrefs((p) => ({ ...p, layout }));
		},
	});
};
