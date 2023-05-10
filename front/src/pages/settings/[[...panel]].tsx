import {
	Box, Tab, Tabs
} from '@mui/material';
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import UsersSettings from "../../components/settings/users-settings";
import prepareSSR, { InferSSRProps } from '../../ssr';
import LibrariesSettings from '../../components/settings/libraries-settings';
import Translate from '../../i18n/translate';

const AvailablePanels = ['libraries', 'users'] as const;

type PanelName = typeof AvailablePanels[number];

const Panels: Record<PanelName, JSX.Element> = {
	libraries: <LibrariesSettings/>,
	users: <UsersSettings/>
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
		additionalProps: { panel }
	};
});

const SettingsPage = (props: InferSSRProps<typeof getServerSideProps>) => {
	const router = useRouter();
	const [panel, setPanel] = useState(props.panel ?? getPanelFromQuery(router.query.panel?.at(0)));

	useEffect(() => {
		router.push(`/settings/${panel}`, undefined, { shallow: true });
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [panel]);
	return <>
		<Tabs
			value={panel}
			onChange={(__, panelName) => setPanel(panelName)}
			centered
		>
			{AvailablePanels.map((panelName, index) =>
				<Tab key={index} value={panelName}
					label={<Translate translationKey={panelName}/>}
				/>)
			}
		</Tabs>
		{AvailablePanels.map((panelName) => panelName == panel &&
			<Box key={panelName} sx={{ paddingX: 1, paddingY: 2, width: '100%' }}>
				{Panels[panelName]}
			</Box>)
		}
	</>;
};

export default SettingsPage;
