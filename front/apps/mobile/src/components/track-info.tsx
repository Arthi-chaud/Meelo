import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getSourceFile, getTrack } from "@/api/queries";
import { type Icon as IconComponent, SongTypeIcon } from "@/ui/icons";
import formatDuration from "@/utils/format-duration";
import { useQuery } from "~/api";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Text } from "~/primitives/text";
import { LoadableText } from "./loadable_text";

export const TrackInfo = ({ trackId }: { trackId: number }) => {
	const { t } = useTranslation();
	const yesStr = t("misc.yes");
	const noStr = t("misc.no");
	const { data: track } = useQuery(() => getTrack(trackId, ["song"]));
	const { data: file } = useQuery(
		(fileId) => getSourceFile(fileId),
		track?.sourceFileId,
	);

	return (
		<View style={styles.root}>
			<Row label={t("fileInfo.name")} value={track?.name} />
			<Row label={t("fileInfo.type")} value={track?.type} />
			{track?.song !== null && (
				<Row
					label={t("song.songType")}
					value={track?.song?.type}
					icon={SongTypeIcon(track?.song.type)}
				/>
			)}
			<Row
				label={t("track.remastered")}
				value={track?.isRemastered ? yesStr : noStr}
			/>
			<Row
				label={t("track.mixed")}
				value={track?.mixed ? yesStr : noStr}
			/>
			{track?.song !== null && (
				<Row
					label={t("fileInfo.bpm")}
					value={track?.song.bpm?.toString() ?? "Unknown"}
				/>
			)}
			<Row
				label={t("fileInfo.duration")}
				value={
					track
						? track.duration
							? formatDuration(track.duration)
							: "Unknown"
						: undefined
				}
			/>
			<Row
				label={t("fileInfo.bitRate")}
				value={
					track
						? track.bitrate
							? `${track.bitrate} kbps`
							: "Unknown"
						: undefined
				}
			/>
			<Row label={t("fileInfo.path")} value={file?.path} />
			<Row
				label={t("fileInfo.registrationDate")}
				value={
					file
						? new Date(file.registerDate).toLocaleString()
						: undefined
				}
			/>
		</View>
	);
};

const Row = ({
	label,
	value,
	icon,
}: {
	label: string;
	value: string | undefined;
	icon?: IconComponent;
}) => {
	return (
		<View style={styles.rowContainer}>
			<View style={styles.row}>
				<View style={styles.label}>
					<Text content={label} variant="h6" />
				</View>
				<View style={styles.value}>
					{icon && <Icon icon={icon} style={styles.icon} />}
					<LoadableText
						content={value}
						variant="body"
						skeletonWidth={20}
					/>
				</View>
			</View>
			<Divider h />
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		paddingHorizontal: theme.gap(1),
	},
	rowContainer: { width: "100%" },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1.5),
	},
	label: {
		width: "30%",
		maxWidth: 400,
		justifyContent: "center",
	},
	icon: { size: theme.fontSize.rem(1.25) } as any,
	value: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
}));
