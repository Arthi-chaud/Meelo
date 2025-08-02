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

import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { Redirect, Tabs } from "expo-router";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getCurrentUserStatus } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import {
	BrowseIcon,
	HomeIcon,
	type Icon as IconType,
	SearchIcon,
	SettingsIcon,
} from "@/ui/icons";
import { useAPI } from "~/api";
import { BlurView } from "~/components/blur-view";
import { Icon } from "~/primitives/icon";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

//TODO DRY: The header style for settings is very similar to the shared routed ones.
//TODO I suspect that the setting header style is not updated when theme changes because we don't use withUnistyles
//However, the latter does not work

const styles = StyleSheet.create((theme) => ({
	screen: { backgroundColor: "transparent", flex: 1 },
	headerTitle: {
		color: theme.colors.text.primary,
		...theme.fontStyles.regular,
	},
	headerBackgroundContainer: {
		...StyleSheet.absoluteFillObject,
		borderBottomLeftRadius: theme.borderRadius,
		borderBottomRightRadius: theme.borderRadius,
		overflow: "hidden",
	},
	headerBackgroundContent: { flex: 1 },
	tabBar: {
		position: "absolute",
		paddingTop: theme.gap(1),
		borderTopWidth: 0,
	},
	tabBarBackground: {
		...StyleSheet.absoluteFillObject,
		borderTopLeftRadius: theme.borderRadius,
		borderTopRightRadius: theme.borderRadius,
		overflow: "hidden",
		backgroundColor: "transparent",
	},
}));

const TabIcon = ({ icon, focused }: { icon: IconType; focused: boolean }) => {
	return <Icon icon={icon} variant={focused ? "Bold" : "Outline"} />;
};

// Note: if we use our pressable, there is a delay between when the button become bold and when opacity gets back to 1
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
				sceneStyle: styles.screen,
				tabBarShowLabel: false,
				tabBarStyle: styles.tabBar,
				tabBarBackground: () => (
					<BlurView style={styles.tabBarBackground} />
				),
				tabBarButton: TabButton,
			}}
		>
			<Tabs.Screen
				name="(home)"
				options={{
					title: t("nav.home"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={HomeIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="(browse)"
				options={{
					title: t("nav.browse"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={BrowseIcon} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="(search)"
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
					headerShown: true,
					headerTransparent: true,
					headerTitleStyle: styles.headerTitle,
					headerBackground: () => (
						<View style={styles.headerBackgroundContainer}>
							<BlurView style={styles.headerBackgroundContent} />
						</View>
					),
					title: t("nav.settings"),
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={SettingsIcon} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}
