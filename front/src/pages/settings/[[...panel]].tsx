import { Box, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import UsersSettings from "../../components/settings/users-settings";
import prepareSSR, { InferSSRProps } from "../../ssr";
import LibrariesSettings from "../../components/settings/libraries-settings";
import Translate from "../../i18n/translate";
import API from "../../api/api";
import { useQuery } from "../../api/use-query";
import LoadingPage from "../../components/loading/loading-page";
import UserSettings from "../../components/settings/user-settings";

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

export const getServerSideProps = prepareSSR((context) => {
	const panel = getPanelFromQuery(context.query.panel?.at(0));

	return {
		additionalProps: { panel },
		infiniteQueries: [API.getUsers(), API.getLibraries()],
	};
});

const SettingsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const [panel, setPanel] = useState(
		props.additionalProps?.panel ??
			getPanelFromQuery(router.query.panel?.at(0)),
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
					<Tab
						key={index}
						value={panelName}
						label={<Translate translationKey={panelName} />}
					/>
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

export default SettingsPage;
