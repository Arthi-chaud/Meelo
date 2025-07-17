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

import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { SafeScrollView } from "~/components/safe-view";
import { Button } from "~/primitives/button";
import { Text } from "~/primitives/text";
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

export default function SettingsView() {
	const { t } = useTranslation();
	const setAccessToken = useSetAtom(accessTokenAtom);
	const setInstanceUrl = useSetAtom(instanceUrlAtom);
	return (
		<SafeScrollView style={styles.root}>
			<View style={styles.section}>
				<Text
					style={styles.sectionHeader}
					variant="h4"
					content={t("actions.logout")}
				/>
				<Button
					title={t("actions.logout")}
					containerStyle={{ alignItems: "center" }}
					labelStyle={styles.sectionHeaderLabel}
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
		paddingTop: theme.gap(1),
		paddingBottom: theme.gap(1),
		gap: theme.gap(1),
	},
	sectionHeader: { paddingLeft: theme.gap(1) },
	sectionHeaderLabel: { flex: 1 },
}));
