import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { EmptyStateIcon, type Icon } from "@/ui/icons";
import { Text } from "~/primitives/text";

type Props = Partial<{ icon: Icon; text: TranslationKey }>;

export const EmptyState = ({ icon, text }: Props) => {
	const { t } = useTranslation();
	const IconComponent = withUnistyles(icon ?? EmptyStateIcon, (theme) => ({
		color: theme.colors.text.secondary,
	}));
	return (
		<View style={styles.root}>
			<IconComponent />
			<Text
				style={styles.text}
				content={t(text ?? "emptyState.default")}
			/>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		gap: theme.gap(2),
		justifyContent: "space-evenly",
		alignItems: "center",
	},
	text: { color: theme.colors.text.secondary, ...theme.fontStyles.medium },
}));
