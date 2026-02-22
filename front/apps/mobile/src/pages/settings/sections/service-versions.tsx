import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getMatcherVersion,
	getScannerVersion,
	getSettings,
} from "@/api/queries";
import { useQuery } from "~/api";
import { LoadableText } from "~/components/loadable_text";
import { Text } from "~/primitives/text";
import { Section } from "../components";

export const ServiceVersionsSettings = () => {
	const { data: apiSettings } = useQuery(getSettings);
	const { data: scannerVersion } = useQuery(getScannerVersion);
	const { data: matcherVersion } = useQuery(getMatcherVersion);
	return (
		<Section>
			<View style={styles.footer}>
				<Text
					style={styles.versionNumber}
					content={`Build: ${BuildCommit}`}
				/>
				{(
					[
						["API", apiSettings],
						["Scanner", scannerVersion],
						["Matcher", matcherVersion],
					] as const
				).map(([serviceName, versionQuery]) => (
					<LoadableText
						key={serviceName}
						style={styles.versionNumber}
						content={
							apiSettings
								? `${serviceName} version: ${versionQuery ? (versionQuery.version ?? "Unknown") : "Loading"}`
								: undefined
						}
						skeletonWidth={15}
					/>
				))}
			</View>
		</Section>
	);
};

const BuildCommit =
	process.env.EXPO_PUBLIC_BUILD_COMMIT ??
	(process.env.NODE_ENV === "development" ? "dev" : "unknown");

const styles = StyleSheet.create((theme) => ({
	footer: {
		color: theme.colors.text.secondary,
		width: "100%",
		alignItems: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1),
	},
	versionNumber: { color: theme.colors.text.secondary },
}));
