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

import { type NextRouter, useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Utilitary to update router when using tabs
 * @param getTabValueFromRouter how to get the tab value from the router state
 * @param defaultTab the default tab
 * @param otherTabs the other tabs
 */
export const useTabRouter = <TabValue extends string>(
	getTabValueFromRouter: (
		router: NextRouter,
	) => string | string[] | undefined,
	// This should persist the tab change in the router
	urlOnTabChange: (newTab: TabValue) => string,
	defaultTab: TabValue,
	...otherTabs: TabValue[]
) => {
	const router = useRouter();
	const _ = useTranslation();
	const tabs = useMemo(
		() => [defaultTab, ...otherTabs],
		[defaultTab, otherTabs],
	);
	const getTabFromQuery = () =>
		tabs.find(
			(availableTab) =>
				availableTab.toLowerCase() ===
				getTabValueFromRouter(router)?.toString().toLowerCase(),
		);
	const [selectedTab, selectTab] = useState<TabValue>(
		getTabFromQuery() ?? defaultTab,
	);

	//Handle going back in history
	useEffect(() => {
		const tabFromQuery = getTabFromQuery();
		const newTab = tabFromQuery ?? defaultTab;
		if (newTab !== selectedTab) {
			selectTab(tabFromQuery ?? defaultTab);
		}
	}, [router.asPath]);
	useEffect(() => {
		router.push(urlOnTabChange(selectedTab), undefined, {
			shallow: true,
		});
	}, [selectedTab]);

	return { selectedTab, selectTab };
};
