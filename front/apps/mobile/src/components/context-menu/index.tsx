import { ContextualMenuIcon } from "@/ui/icons";
import { StyleSheet } from "react-native-unistyles";
import { useContextMenu } from "~/hooks/context-menu";
import type { ContextMenuProps } from "~/components/context-menu/model";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

// Button that allows opening the modal
export const ContextMenu = (props: ContextMenuProps) => {
	const { openContextMenu } = useContextMenu(props);

	return (
		<Pressable onPress={openContextMenu} style={styles.button}>
			<Icon icon={ContextualMenuIcon} />
		</Pressable>
	);
};

const styles = StyleSheet.create(() => ({
	button: {
		transform: [{ rotate: "90deg" }],
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
}));
