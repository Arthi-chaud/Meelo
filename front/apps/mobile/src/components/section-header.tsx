import { type Href, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MoreIcon } from "@/ui/icons";
import { Button } from "~/primitives/button";
import { Pressable } from "~/primitives/pressable";
import { LoadableText } from "./loadable_text";

type Props = {
	onPress?: () => void;
	style?: ViewStyle;
	seeMore?: Href;
	trailing?: React.ReactElement;
} & Omit<ComponentProps<typeof LoadableText>, "variant">;

export const SectionHeader = ({
	onPress,
	style,
	seeMore,
	trailing,
	...textProps
}: Props) => {
	const { t } = useTranslation();
	const router = useRouter();
	return (
		<View style={[styles.root, style]}>
			<Pressable
				onPress={() => onPress?.()}
				disabled={!onPress}
				// To keep the text from pushing the button out of the container
				style={{ flex: 1, flexShrink: 1 }}
			>
				<LoadableText {...textProps} variant="h4" numberOfLines={1} />
			</Pressable>
			{trailing ||
				(seeMore !== undefined && (
					<Button
						containerStyle={styles.button(
							textProps.content === undefined,
						)}
						size="small"
						title={t("browsing.seeAll")}
						icon={MoreIcon}
						iconPosition="right"
						onPress={() => router.navigate(seeMore)}
					/>
				))}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
		paddingHorizontal: theme.gap(1),
		paddingRight: theme.gap(2),
		marginBottom: theme.gap(1),
	},
	button: (isLoading: boolean) => ({
		opacity: isLoading ? 0 : 1,
	}),
}));
