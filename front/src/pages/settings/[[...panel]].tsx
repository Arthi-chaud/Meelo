import {
	Box, Tab
} from "@mui/material";
import {
	TabContext, TabList, TabPanel
} from '@mui/lab';
import { useEffect, useState } from "react";
import prepareSSR, { InferSSRProps } from "../../ssr";
import { useRouter } from "next/router";
import LibrariesSettings from "../../components/settings/libraries-settings";
import UsersSettings from "../../components/settings/users-settings copy";

const AvailablePanels = ['libraries', 'users'];

const getPanelFromQuery = (query?: string): string => {
	if (!AvailablePanels.includes(query?.toString().toLowerCase() ?? '')) {
		return 'libraries';
	}
	return query!;
};

export const getServerSideProps = prepareSSR((context) => {
	const panel = getPanelFromQuery(context.query.panel as string);

	return {
		additionalProps: { panel }
	};
});

const SettingsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const [panel, setPanel] = useState(getPanelFromQuery(props.panel ?? router.query.panel));

	useEffect(() => {
		router.push(`/settings/${panel}`, undefined, { shallow: true });
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [panel]);
	return <>
		<TabContext value={panel}>
			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<TabList onChange={(__, newPanel) => setPanel(AvailablePanels[newPanel])}>
					{AvailablePanels.map((panelName) => <Tab key={panelName} label={panelName}/>)}
				</TabList>
			</Box>
			{AvailablePanels.map((panelName) =>
				<TabPanel key={panelName} value={panelName}>
					{panelName == 'libraries'
						? <LibrariesSettings/>
						: <UsersSettings/>
					}
				</TabPanel>)}
		</TabContext>
	</>;
};

export default SettingsPage;
