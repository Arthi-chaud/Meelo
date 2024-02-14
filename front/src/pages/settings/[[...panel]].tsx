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

import { Box, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import UsersSettings from "../../components/settings/users-settings";
import { GetPropsTypesFrom, Page } from "../../ssr";
import LibrariesSettings from "../../components/settings/libraries-settings";
import API from "../../api/api";
import { useQuery } from "../../api/use-query";
import LoadingPage from "../../components/loading/loading-page";
import UserSettings from "../../components/settings/user-settings";
import { useTranslation } from "react-i18next";
import { NextPageContext } from "next";

// NOTE: Data Grid do not support SSR
// https://github.com/mui/mui-x/issues/7599

const AvailablePanels = ["interface", "libraries", "users"] as const;

type PanelName = (typeof AvailablePanels)[number];

const Panels: Record<PanelName, JSX.Element> = {
	interface: <UserSettings />,
	libraries: <LibrariesSettings />,
	users: <UsersSettings />,
};

const getPanelFromQuery = (query?: string): PanelName => {
	if (!query || !AvailablePanels.includes(query.toLowerCase() as PanelName)) {
		return AvailablePanels[0];
	}
	return query as PanelName;
};

const prepareSSR = (context: NextPageContext) => {
	const panel = getPanelFromQuery(context.query.panel?.at(0));

	return {
		additionalProps: { panel },
		// Disabling Prefetch of queries, as some are admin-only
		infiniteQueries: [],
	};
};

const SettingsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const router = useRouter();
	const { t } = useTranslation();
	const [panel, setPanel] = useState(
		props?.panel ?? getPanelFromQuery(router.query.panel?.at(0)),
	);
	const userQuery = useQuery(API.getCurrentUserStatus);

	useEffect(() => {
		if (userQuery.data?.admin === true) {
			router.push(`/settings/${panel}`, undefined, { shallow: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [panel]);

	if (!userQuery.data) {
		return <LoadingPage />;
	}
	if (userQuery.data.admin === false) {
		return <UserSettings />;
	}
	return (
		<>
			<Tabs
				value={panel}
				onChange={(__, panelName) => setPanel(panelName)}
				centered
			>
				{AvailablePanels.map((panelName, index) => (
					<Tab key={index} value={panelName} label={t(panelName)} />
				))}
			</Tabs>
			{AvailablePanels.map(
				(panelName) =>
					panelName == panel && (
						<Box
							key={panelName}
							sx={{ paddingX: 1, paddingY: 2, width: "100%" }}
						>
							{Panels[panelName]}
						</Box>
					),
			)}
		</>
	);
};

SettingsPage.prepareSSR = prepareSSR;

export default SettingsPage;
