import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { playlistAtom } from "@/state/player";
import { DeleteIcon, MoreIcon, WarningIcon } from "@/ui/icons";
import { useModal } from "~/components/bottom-modal-sheet";
import { InstanceButton } from "~/components/instance-button";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Text } from "~/primitives/text";
import {
	currentInstanceAtom,
	deleteOtherInstanceAtom,
	type MeeloInstance,
	otherInstancesAtom,
	popCurrentInstanceAtom,
} from "~/state/user";
import { Section, SectionHeader } from "../components";
import { useOnLeavingInstance } from "../hooks";

export const InstancesSettings = () => {
	const [currentInstance, setCurrentInstance] = useAtom(currentInstanceAtom);
	const otherInstances = useAtomValue(otherInstancesAtom);
	const popCurrentInstance = useSetAtom(popCurrentInstanceAtom);
	const deleteOtherInstance = useSetAtom(deleteOtherInstanceAtom);
	const onLeavingInstance = useOnLeavingInstance();
	const playlist = useAtomValue(playlistAtom);

	const onOtherInstanceSelect = useCallback(
		(instance: MeeloInstance) => {
			onLeavingInstance();
			popCurrentInstance();
			deleteOtherInstance(instance);
			setCurrentInstance(instance);
		},
		[onLeavingInstance, popCurrentInstanceAtom, setCurrentInstance],
	);
	const { openModal: openConfirmModal } = useModal({
		content: (instance: MeeloInstance) => (
			<LeavingInstanceWarningModal
				onConfirm={() => onOtherInstanceSelect(instance)}
			/>
		),
		onDismiss: () => {},
	});

	return (
		<Section>
			<SectionHeader title="actions.switchServer.label" />
			{currentInstance && (
				<>
					<View style={styles.instanceButtonContainer}>
						<InstanceButton
							enabled={false}
							instance={currentInstance}
							trailing="(Current)"
						/>
					</View>
					<Divider h withInsets />
				</>
			)}
			{otherInstances.map((instance, idx) => (
				<Fragment key={idx}>
					<View style={styles.instanceButtonContainer}>
						<InstanceButton
							enabled
							instance={instance}
							actions={[
								{
									icon: DeleteIcon,
									onPress: () =>
										deleteOtherInstance(instance),
								},
								{
									icon: MoreIcon,
									onPress: () => {
										if (playlist.length === 0) {
											onOtherInstanceSelect(instance);
										} else {
											openConfirmModal(instance);
										}
									},
								},
							]}
						/>
					</View>
					{idx < otherInstances.length - 1 && (
						<Divider h withInsets />
					)}
				</Fragment>
			))}
		</Section>
	);
};

const styles = StyleSheet.create((theme) => ({
	instanceButtonContainer: {
		paddingHorizontal: theme.gap(1),
		paddingBottom: theme.gap(0.5),
	},
}));

const LeavingInstanceWarningModal = ({
	onConfirm,
}: {
	onConfirm: () => void;
}) => {
	const { t } = useTranslation();
	const { dismiss } = useBottomSheetModal();
	return (
		<View style={modalStyles.root}>
			<View style={modalStyles.header}>
				<WarningIcon />
				<Text variant="secondaryTitle" content={t("actions.warningModalTitle")} />
			</View>

			<View style={modalStyles.content}>
				<Text
					variant="itemText"
					content={t("actions.switchServer.modalMessage")}
				/>
			</View>
			<Button
				title={t("actions.switchServer.label")}
				icon={MoreIcon}
				iconPosition="right"
				width="fitContent"
				onPress={() => {
					dismiss();
					onConfirm();
				}}
			/>
		</View>
	);
};

const modalStyles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		backgroundColor: "transparent",
		alignItems: "center",
		padding: theme.gap(2),
		gap: theme.gap(2),
	},
	header: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: theme.gap(1),
	},
	content: { width: "100%", alignItems: "center", textAlign: "center" },
}));
