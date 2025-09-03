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

import { openBrowserAsync } from "expo-web-browser";
import i18next from "i18next";
import { useAtom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import {
	getCurrentUserStatus,
	getScannerVersion,
	getSettings,
} from "@/api/queries";
import { emptyPlaylistAtom } from "@/state/player";
import {
	CheckIcon,
	ExpandMoreIcon,
	OpenExternalIcon,
	UncheckIcon,
} from "@/ui/icons";
import { useQuery, useQueryClient } from "~/api";
import { SelectModalButton } from "~/components/bottom-modal-sheet/select";
import { LoadableText } from "~/components/loadable_text";
import { SafeScrollView } from "~/components/safe-view";
import { SectionHeader } from "~/components/section-header";
import { useColorScheme } from "~/hooks/color-scheme";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { colorSchemePreference } from "~/state/color-scheme";
import { languagePreference } from "~/state/lang";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";
import { Languages } from "../../../../../translations";

const BuildCommit =
	process.env.EXPO_PUBLIC_BUILD_COMMIT ??
	(process.env.NODE_ENV === "development" ? "dev" : "unknown");

export default function SettingsView() {
	const queryClient = useQueryClient();
	const { data: user } = useQuery(getCurrentUserStatus);
	const emptyPlaylist = useSetAtom(emptyPlaylistAtom);
	const { t } = useTranslation();
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setInstanceUrl = useSetAtom(instanceUrlAtom);
	const insets = useSafeAreaInsets();
	const [colorSchemePref, setColorSchemePref] = useAtom(
		colorSchemePreference,
	);
	const [lng, setLng] = useAtom(languagePreference);
	const { data: apiSettings } = useQuery(getSettings);
	const { data: scannerVersion } = useQuery(getScannerVersion);
	const actualColorScheme = useColorScheme();
	return (
		<SafeScrollView style={[styles.root, { paddingTop: insets.top }]}>
			<View style={styles.header}>
				<Text content={t("nav.settings")} variant="h2" />
			</View>
			<Divider h />
			<View style={styles.section}>
				<SectionHeader
					style={styles.sectionHeader}
					content={t("settings.interface")}
					skeletonWidth={0}
				/>
				<View style={styles.sectionRow}>
					<Text
						content={t("settings.ui.useSystemTheme")}
						variant="h5"
					/>
					<Pressable
						onPress={() => {
							if (colorSchemePref === "system") {
								setColorSchemePref(actualColorScheme);
							} else {
								setColorSchemePref("system");
							}
						}}
					>
						<Icon
							variant={
								colorSchemePref === "system"
									? "Bold"
									: "Outline"
							}
							icon={
								colorSchemePref === "system"
									? CheckIcon
									: UncheckIcon
							}
						/>
					</Pressable>
				</View>

				<View style={styles.sectionRow}>
					<Text
						content={t("settings.ui.useDarkTheme")}
						variant="h5"
					/>
					<Pressable
						disabled={colorSchemePref === "system"}
						onPress={() => {
							setColorSchemePref(
								colorSchemePref === "dark" ? "light" : "dark",
							);
						}}
					>
						<Icon
							style={
								colorSchemePref === "system"
									? styles.disabledCheckButton
									: undefined
							}
							icon={
								actualColorScheme === "dark"
									? CheckIcon
									: UncheckIcon
							}
						/>
					</Pressable>
				</View>

				<View style={styles.sectionRow}>
					<Text content={t("settings.ui.language")} variant="h5" />
					<SelectModalButton
						header={t("settings.ui.language")}
						closeOnSelect
						values={Languages}
						isSelected={(item) => lng === item}
						buttonProps={{
							title: t(
								`settings.ui.lang.${i18next.language as "en"}`,
							),
							icon: ExpandMoreIcon,
							iconPosition: "right",
							size: "small",
						}}
						onSelect={(selected) => {
							setLng(selected);
						}}
						formatItem={(item) =>
							t(`settings.ui.lang.${item}`, {
								lng: item,
							})
						}
					/>
				</View>
			</View>

			{user?.admin && (
				<>
					<Divider h />
					<View style={styles.section}>
						<SectionHeader
							style={styles.sectionHeader}
							content={t("settings.users.admin")}
							skeletonWidth={0}
						/>
						<Button
							title={t("settings.manageFromWebApp")}
							onPress={() =>
								openBrowserAsync(
									queryClient.api.urls.api.replace(
										"/api",
										"/settings",
									),
								)
							}
							icon={OpenExternalIcon}
							iconPosition="right"
							containerStyle={{ justifyContent: "center" }}
						/>
					</View>
				</>
			)}
			<Divider h />
			<View style={styles.section}>
				<SectionHeader
					style={styles.sectionHeader}
					content={t("actions.logout")}
					skeletonWidth={0}
				/>
				<Button
					title={t("actions.logout")}
					containerStyle={{ alignItems: "center" }}
					labelStyle={styles.logoutButtonStyle}
					onPress={() => {
						emptyPlaylist();
						queryClient.client.clear();
						setAccessToken(null);
						setInstanceUrl(null);
					}}
				/>
			</View>
			<Divider h />
			<View style={[styles.footer, styles.section]}>
				<Text
					style={styles.versionNumber}
					content={`Build: ${BuildCommit}`}
				/>
				<LoadableText
					style={styles.versionNumber}
					content={
						apiSettings
							? `API version: ${apiSettings?.version ?? "Loading"}`
							: undefined
					}
					skeletonWidth={15}
				/>
				<LoadableText
					style={styles.versionNumber}
					content={
						scannerVersion
							? `Scanner version: ${scannerVersion.version ?? "Loading"}`
							: undefined
					}
					skeletonWidth={15}
				/>
			</View>
		</SafeScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: { paddingHorizontal: theme.gap(1) },
	header: { paddingHorizontal: theme.gap(1), paddingVertical: theme.gap(2) },
	section: {
		paddingVertical: theme.gap(1),
		gap: theme.gap(1),
	},
	sectionHeader: { marginLeft: -theme.gap(1) },
	sectionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		paddingBottom: theme.gap(0.5),
		paddingHorizontal: theme.gap(1),
	},
	disabledCheckButton: { color: theme.colors.text.secondary },
	logoutButtonStyle: { flex: 1 },
	footer: {
		color: theme.colors.text.secondary,
		width: "100%",
		alignItems: "center",
		gap: theme.gap(2),
	},
	versionNumber: { color: theme.colors.text.secondary },
}));
