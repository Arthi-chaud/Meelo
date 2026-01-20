import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BackIcon, ErrorIcon, RetryIcon, SettingsIcon } from "@/ui/icons";
import { Button } from "~/primitives/button";
import { Icon } from "~/primitives/icon";
import { Text } from "~/primitives/text";

export const ErrorModal = ({
	error,
	tryAgain,
	dismiss,
}: {
	error: Error;
	tryAgain: () => void;
	dismiss: () => void;
}) => {
	const { t } = useTranslation();
	const router = useRouter();
	return (
		<View style={styles.root}>
			<Icon icon={ErrorIcon} style={styles.icon} />
			<Text content={t("errors.errorOccured")} variant="h4" />
			<Text content={error.toString()} variant="body" />
			<View style={styles.buttons}>
				{router.canGoBack() ? (
					<Button
						icon={BackIcon}
						title={t("errors.goBack")}
						onPress={() => router.back()}
					/>
				) : (
					<Button
						icon={SettingsIcon}
						title={t("actions.goToSettingsPage")}
						onPress={() => {
							dismiss();
							router.navigate("/settings");
						}}
					/>
				)}
				<Button
					icon={RetryIcon}
					title={t("errors.tryAgain")}
					onPress={tryAgain}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { alignItems: "center", gap: theme.gap(2), padding: theme.gap(2) },
	icon: { color: theme.colors.error, size: theme.gap(5) },
	buttons: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingTop: theme.gap(1),
	},
}));
