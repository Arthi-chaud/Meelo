import type {
	AlbumExternalMetadata,
	ArtistExternalMetadata,
	ExternalMetadataSource,
} from "@/models/external-metadata";
import { StyleSheet } from "react-native-unistyles";
import { SectionHeader } from "./section-header";
import { useTranslation } from "react-i18next";
import { Text } from "~/primitives/text";
import { useMemo, useRef } from "react";
import { Linking, ScrollView, View, type ViewStyle } from "react-native";
import { generateArray } from "@/utils/gen-list";
import { TextSkeleton } from "~/primitives/text";
import { LoadableText } from "./loadable_text";
import { Image } from "expo-image";
import { useAPI } from "~/api";
import { Pressable } from "~/primitives/pressable";

type Props = {
	externalMetadata:
		| AlbumExternalMetadata
		| ArtistExternalMetadata
		| undefined;
	style?: ViewStyle;
};

/* TODO Expand description on touch */

const DescriptionLineCount = 10;

// Generic section for external metadata.
export const ExternalMetadataDescriptionSection = ({
	externalMetadata,
	style,
}: Props) => {
	const { t } = useTranslation();
	const heading = useMemo(() => t("browsing.sections.about"), [t]);
	if (externalMetadata?.description === null) {
		return null;
	}
	return (
		<View style={[styles.root, style]}>
			<SectionHeader
				skeletonWidth={heading.length}
				content={externalMetadata === undefined ? undefined : heading}
			/>
			<View style={styles.descriptionContainer}>
				{externalMetadata?.description === undefined ? (
					<>
						{generateArray(DescriptionLineCount).map((_, idx) => (
							<TextSkeleton
								key={idx}
								width={"100%"}
								variant="body"
							/>
						))}
					</>
				) : (
					externalMetadata.description !== null && (
						<Text
							content={externalMetadata.description}
							variant="body"
							style={styles.descriptionText}
							numberOfLines={DescriptionLineCount}
						/>
					)
				)}
			</View>
		</View>
	);
};

// Generic section for external metadata.
// Will render empty view if no sources
export const ExternalMetadataSourcesSection = ({
	externalMetadata,
	style,
}: Props) => {
	const { t } = useTranslation();
	const api = useAPI();
	const heading = useMemo(() => t("models.externalLink_plural"), [t]);
	const scrollRef = useRef<ScrollView>(null);
	if (externalMetadata && externalMetadata.sources.length === 0) {
		return null;
	}
	return (
		<View style={[styles.root, style]}>
			<SectionHeader
				skeletonWidth={heading.length}
				onPress={() =>
					scrollRef.current?.scrollTo({ x: 0, animated: true })
				}
				content={externalMetadata === undefined ? undefined : heading}
			/>
			<ScrollView
				ref={scrollRef}
				horizontal
				contentContainerStyle={styles.externalLinks}
			>
				{(externalMetadata?.sources ?? generateArray(2)).map(
					(source: ExternalMetadataSource | undefined, idx) => (
						<Pressable
							onPress={() =>
								//TODO Use webview instead
								source && Linking.openURL(source.url)
							}
							key={source?.providerId ?? idx}
							style={styles.externalLink}
						>
							{source ? (
								<Image
									contentFit="contain"
									source={{
										uri: source
											? api.getIllustrationURL(
													source.providerIcon,
													"original",
												)
											: undefined,
										headers: {
											Authorization: `Bearer ${api.accessToken}`,
										},
									}}
									style={styles.externalLinkIcon}
								/>
							) : (
								<View
									style={[
										styles.externalLinkIcon,
										styles.externalLinkIconPlaceholder,
									]}
								/>
							)}
							<LoadableText
								content={source?.providerName}
								variant="body"
								skeletonWidth={10}
							/>
						</Pressable>
					),
				)}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		flex: 1,
	},
	externalLinks: {
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(1.5),
		marginBottom: theme.gap(1),
	},
	externalLinkIcon: {
		aspectRatio: 1,
		height: "100%",
	},

	externalLinkIconPlaceholder: {
		backgroundColor: theme.colors.skeleton,
		borderRadius: theme.borderRadius,
	},
	externalLink: {
		borderWidth: 1,
		gap: theme.gap(1),
		borderColor: theme.colors.text.secondary,
		borderRadius: theme.borderRadius,
		padding: theme.gap(1),
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	descriptionText: {
		lineHeight: theme.gap(2.5),
	},
	descriptionContainer: {
		flex: 1,
		paddingHorizontal: theme.gap(1.5),
	},
}));
