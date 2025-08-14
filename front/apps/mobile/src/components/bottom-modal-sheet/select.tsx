import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { type ComponentProps, useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Icon as IconType } from "@/ui/icons";
import { Chip } from "~/components/chip";
import { Button } from "~/primitives/button";
import { Text } from "~/primitives/text";
import { useModal } from ".";

type Props<T> = {
	header?: string;
	values: readonly T[];
	isSelected: (item: T) => boolean;
	onSelect: (item: T) => void;
	formatItem: (item: T) => string;
	checkIcon?: IconType;
	closeOnSelect?: boolean;
};

export const SelectBottomModalContent = <T,>({
	header,
	values,
	isSelected,
	onSelect,
	formatItem,
	checkIcon,
	closeOnSelect: dismissOnSelect,
}: Props<T>) => {
	const { dismiss } = useBottomSheetModal();
	const onPress = useCallback(
		(t: T) => {
			if (dismissOnSelect) {
				dismiss();
			}
			onSelect(t);
		},
		[onSelect, dismiss],
	);
	return (
		<View style={styles.root}>
			{header && (
				<View style={styles.header}>
					<Text content={header} variant="h4" />
				</View>
			)}
			<View style={styles.grid}>
				{values.map((value, idx) => (
					<Chip
						filled={isSelected(value)}
						key={idx}
						title={formatItem(value)}
						onPress={() => onPress(value)}
						icon={isSelected(value) ? checkIcon : undefined}
					/>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%" },
	header: { width: "100%", alignItems: "center" },
	grid: {
		padding: theme.gap(2),
		paddingBottom: theme.gap(3),
		flexDirection: "row",
		gap: theme.gap(2),
		flexWrap: "wrap",
		justifyContent: "center",
	},
}));

export const SelectModalButton = <T,>({
	buttonProps,
	...props
}: Props<T> & {
	buttonProps: Omit<
		ComponentProps<typeof Button>,
		"propagateToParent" | "onPress"
	>;
}) => {
	const content = useCallback(
		() => <SelectBottomModalContent {...props} />,
		[props],
	);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});
	return <Button {...buttonProps} onPress={openModal} />;
};
