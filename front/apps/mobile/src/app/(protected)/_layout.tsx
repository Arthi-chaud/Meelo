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

import {
	BrowseIcon,
	HomeIcon,
	type Icon,
	SearchIcon,
	SettingsIcon,
} from "@/ui/icons";
import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const isLoggedIn = false;

const styles = StyleSheet.create((theme) => ({
	//TODO Blur bg of navbar
	navBar: { paddingTop: theme.gap(1) },
	tabIcon: {
		color: theme.colors.text.primary,
	},
}));

const TabIcon = ({
	icon: Icon_,
	focused,
}: { icon: Icon; focused: boolean }) => {
	return (
		<Icon_ variant={focused ? "Bold" : "Outline"} style={styles.tabIcon} />
	);
};

const TabButton = (props: any) => <TouchableOpacity {...props} />;

export default function ProtectedLayout() {
	const { t } = useTranslation();
	if (!isLoggedIn) {
		return <Redirect href="/auth" />;
	}
	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: false,
				tabBarStyle: styles.navBar,
				tabBarButton: TabButton,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t("nav.home"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={HomeIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="browse"
				options={{
					title: t("nav.browse"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={BrowseIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: t("nav.search"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={SearchIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: t("nav.settings"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={SettingsIcon} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}
