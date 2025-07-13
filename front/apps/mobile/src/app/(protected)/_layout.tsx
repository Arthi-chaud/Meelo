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

import { getCurrentUserStatus } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import {
	BrowseIcon,
	HomeIcon,
	type Icon,
	SearchIcon,
	SettingsIcon,
} from "@/ui/icons";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { Redirect, Tabs } from "expo-router";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAPI } from "~/api";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

const styles = StyleSheet.create((theme) => ({
	//TODO Blur bg of navbar
	header: {
		backgroundColor: theme.colors.background,
	},

	headerTitle: {
		color: theme.colors.text.primary,
		...theme.fontStyles.regular,
	},
	screen: { backgroundColor: "transparent", flex: 1 },
	tabBar: {
		paddingTop: theme.gap(1),
		borderTopLeftRadius: theme.borderRadius,
		borderTopRightRadius: theme.borderRadius,
		backgroundColor: theme.colors.background,
	},
}));

const TabIcon = ({ icon, focused }: { icon: Icon; focused: boolean }) => {
	const Icon_ = withUnistyles(
		icon,
		(theme) =>
			({
				variant: focused ? "Bold" : "Outline",
				color: theme.colors.text.primary,
			}) as const,
	);
	return <Icon_ />;
};

const TabButton = (props: any) => <TouchableOpacity {...props} />;

export default function ProtectedLayout() {
	const accessToken = useAtomValue(accessTokenAtom);
	const instanceUrl = useAtomValue(instanceUrlAtom);
	const api = useAPI();
	const user = useTanStackQuery({
		...toTanStackQuery(api, getCurrentUserStatus),
		enabled: !!(accessToken && instanceUrl),
	});
	const { t } = useTranslation();
	if (!accessToken || !instanceUrl || user.error) {
		return <Redirect href="/auth" />;
	}
	//TODO Proper handling of when user is loading
	return (
		<Tabs
			screenOptions={{
				animation: "none",
				headerShown: false,
				tabBarShowLabel: false,
				tabBarStyle: styles.tabBar,
				headerStyle: styles.header,
				sceneStyle: styles.screen,
				//TODO DRY with shared routes
				headerTitleStyle: styles.headerTitle,
				headerTintColor: styles.headerTitle.color,
				tabBarButton: TabButton,
			}}
		>
			<Tabs.Screen
				name="(home)"
				options={{
					headerShown: false,
					title: t("nav.home"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={HomeIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="(browse)"
				options={{
					headerShown: false,
					title: t("nav.browse"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={BrowseIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					headerShown: true,
					title: t("nav.search"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={SearchIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					headerShown: true,
					title: t("nav.settings"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={SettingsIcon} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}
