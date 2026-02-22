import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";
import { StyleSheet } from "react-native-unistyles";
import { SectionHeader as SHeader } from "~/components/section-header";
import { Text } from "~/primitives/text";

export const Section = ({ style, ...props }: ViewProps) => {
	return <View {...props} style={[styles.section, style]} />;
};

export const SectionHeader = ({ title }: { title: TranslationKey }) => {
	const { t } = useTranslation();
	return (
		<SHeader
			style={styles.sectionHeader}
			content={t(title)}
			skeletonWidth={0}
		/>
	);
};

export const SectionRowTitle = ({
	title,
	textProps,
}: {
	title: TranslationKey;
	textProps?: Omit<Parameters<typeof Text>[0], "children">;
}) => {
	const { t } = useTranslation();
	return <Text content={t(title)} variant="h5" {...textProps} />;
};

export const SectionRow = ({
	heading,
	action,
}: {
	heading: ReactNode;
	action: ReactNode;
}) => {
	return (
		<View style={styles.sectionRow}>
			<View style={styles.subrow}>{heading}</View>
			<View style={styles.subrow}>{action}</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	section: {
		paddingVertical: theme.gap(1),
		gap: theme.gap(1.5),
	},
	sectionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		paddingBottom: theme.gap(0.5),
		paddingHorizontal: theme.gap(1),
	},
	subrow: { flexDirection: "row", gap: theme.gap(1) },
	sectionHeader: { marginLeft: -theme.gap(1) },
}));
