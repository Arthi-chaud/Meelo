import {
	Box, Tab, Tabs
} from '@mui/material';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LibrariesSettings from "../../components/settings/libraries-settings";
import UsersSettings from "../../components/settings/users-settings";

const AvailablePanels = ['libraries', 'users'];

const getPanelFromQuery = (query?: string): string => {
	if (!AvailablePanels.includes(query?.toLowerCase() ?? '')) {
		return 'libraries';
	}
	return query!;
};

const SettingsPage = () => {
	const router = useRouter();
	const [panel, setPanel] = useState(getPanelFromQuery(router.query.panel?.at(0)));

	useEffect(() => {
		router.push(`/settings/${panel}`, undefined, { shallow: true });
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [panel]);
	return <>
		<Tabs
			value={panel}
			onChange={(__, panelName) => setPanel(panelName)}
			indicatorColor='secondary'
			textColor='secondary'
			centered
		>
			{AvailablePanels.map((panelName, index) =>
				<Tab key={index} value={panelName} label={panelName}/>)
			}
		</Tabs>
		{AvailablePanels.map((panelName) => panelName == panel &&
			<Box key={panelName} sx={{ padding: 6, width: '100%' }}>
				{panelName == 'libraries' ? <LibrariesSettings/> : <UsersSettings/>}
			</Box>)
		}
	</>;
};

export default SettingsPage;
