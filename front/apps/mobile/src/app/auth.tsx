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

import { useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { getCurrentUserStatus } from "@/api/queries";
import { AddIcon } from "@/ui/icons";
import { getAPI_ } from "~/api";
import { useLoginForm } from "~/components/login-form";
import { Banner } from "~/components/meelo";
import { Button } from "~/primitives/button";
import { currentInstanceAtom } from "~/state/user";

const styles = StyleSheet.create((theme, rt) => ({
	root: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		marginBottom: theme.gap(10),
		justifyContent: "space-evenly",
		flex: 1,
	},
	banner: {
		height: 300,
		maxHeight: rt.screen.height / 4,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "flex-end",
	},
	formContainer: {
		display: "flex",
		width: "100%",
		flexDirection: "column",
		justifyContent: "flex-start",
		alignItems: "center",
		gap: theme.gap(3),
	},
}));

export default function AuthenticationScreen() {
	const safeAreaStyle = useSafeAreaInsets();
	const { t } = useTranslation();
	const router = useRouter();
	const setCurrentInstance = useSetAtom(currentInstanceAtom);
	const { openLoginForm } = useLoginForm({
		onLogin: async ({ instanceUrl, token }) => {
			const api = getAPI_(token, instanceUrl);
			const res = await getCurrentUserStatus().exec(api)();
			setCurrentInstance({
				url: instanceUrl,
				accessToken: token,
				username: res.name,
			});
			router.replace("/");
		},
	});
	return (
		<View style={[styles.root, safeAreaStyle]}>
			<Banner style={styles.banner} />
			<View style={styles.formContainer}>
				<Button
					title={t("actions.connectToNewServer")}
					icon={AddIcon}
					onPress={openLoginForm}
				/>
			</View>
			<View />
			{/* to have a 1/3 page-height footer */}
		</View>
	);
}
