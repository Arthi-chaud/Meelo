import { Box, Tab, Tabs } from "@mui/material";
import type { NextRouter } from "next/router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useTabRouter } from "./tab-router";

type Props<Tab extends string> = {
	tabs: readonly Tab[];
	urlFromTab: (newtab: Tab) => string;
	translateTab: (tab: Tab) => TranslationKey;
	getTabFromRouter?: (r: NextRouter) => string | string[] | undefined;
	header: ReactNode;
	render: (tab: Tab) => ReactNode;
};

export const TabPage = <Tab extends string>(props: Props<Tab>) => {
	const { t } = useTranslation();

	const { selectedTab, selectTab } = useTabRouter(
		(r) => props.getTabFromRouter?.(r) ?? r.query.t,
		(newTab) => props.urlFromTab(newTab as Tab),
		props.tabs[0],
		...props.tabs.slice(1),
	);
	return (
		<Box sx={{ width: "100%" }}>
			{props.header}
			<Tabs
				value={selectedTab}
				onChange={(__, tabName) => selectTab(tabName)}
				variant="fullWidth"
			>
				{props.tabs.map((value, index) => (
					<Tab
						key={index}
						value={value}
						sx={{ minWidth: "fit-content", flex: 1 }}
						label={t(props.translateTab(value))}
					/>
				))}
			</Tabs>
			<Box sx={{ paddingBottom: 2 }} />
			{props.render(selectedTab)}
		</Box>
	);
};
