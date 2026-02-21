import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Fragment, useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { DeleteIcon, MoreIcon } from "@/ui/icons";
import { InstanceButton } from "~/components/instance-button";
import { Divider } from "~/primitives/divider";
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

	const onOtherInstanceSelect = useCallback(
		(instance: MeeloInstance) => {
			onLeavingInstance();
			popCurrentInstance();
			deleteOtherInstance(instance);
			setCurrentInstance(instance);
		},
		[onLeavingInstance, popCurrentInstanceAtom, setCurrentInstance],
	);
	return (
		<Section>
			<SectionHeader title="actions.switchServer" />
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
									onPress: () =>
										onOtherInstanceSelect(instance),
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
