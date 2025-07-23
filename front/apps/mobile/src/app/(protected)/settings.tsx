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

import { CheckIcon, ExpandMoreIcon, UncheckIcon } from "@/ui/icons";
import i18next from "i18next";
import { useAtom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { StyleSheet } from "react-native-unistyles";
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
import { type Language, Languages } from "../../../../../translations";

// TODO When setting dark/light mode using settings (not the auto mode)
// header text color is not updated

export default function SettingsView() {
	const { t } = useTranslation();
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setInstanceUrl = useSetAtom(instanceUrlAtom);
	const [colorSchemePref, setColorSchemePref] = useAtom(
		colorSchemePreference,
	);
	const [lng, setLng] = useAtom(languagePreference);

	const actualColorScheme = useColorScheme();
	return (
		<SafeScrollView style={styles.root}>
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
					<SelectDropdown
						data={[...Languages]}
						onSelect={(selected) => {
							setLng(selected);
						}}
						dropdownStyle={styles.dropdownContainer}
						renderItem={(item: Language) => (
							<View style={styles.dropdownItem}>
								<View style={styles.dropdownItemRow}>
									<View style={styles.dropdownItemIcon}>
										{lng === item ? (
											<Icon icon={CheckIcon} />
										) : undefined}
									</View>

									<Text
										style={styles.dropdownItemLabel}
										content={t(`settings.ui.lang.${item}`, {
											lng: item,
										})}
									/>
								</View>

								<Divider h />
							</View>
						)}
						statusBarTranslucent
						dropdownOverlayColor="transparent"
						renderButton={() => (
							<View>
								<Button
									size="small"
									propagateToParent
									icon={ExpandMoreIcon}
									iconPosition="right"
									title={t(
										`settings.ui.lang.${i18next.language as "en"}`,
									)}
								/>
							</View>
						)}
					/>
				</View>
			</View>
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
						setAccessToken(null);
						setInstanceUrl(null);
					}}
				/>
			</View>
		</SafeScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: { paddingHorizontal: theme.gap(1) },
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

	dropdownContainer: {
		borderRadius: theme.borderRadius,
		width: 150,
		gap: theme.gap(2),
	},
	dropdownItem: { backgroundColor: theme.colors.background },
	dropdownItemRow: {
		display: "flex",
		flexDirection: "row",
		gap: theme.gap(1),
		padding: theme.gap(1),
	},
	dropdownItemIcon: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	dropdownItemLabel: {
		flex: 5,
		display: "flex",
		alignItems: "flex-start",
	},
}));
