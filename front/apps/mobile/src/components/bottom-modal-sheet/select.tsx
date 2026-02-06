import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { type ComponentProps, useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CheckIcon, CloseIcon, type Icon as IconType } from "@/ui/icons";
import { Chip } from "~/components/chip";
import { Button } from "~/primitives/button";
import { Text } from "~/primitives/text";
import { useModal } from ".";

type Props<T, S> = {
	header?: string;
	values: readonly T[];
	selected: S;
	checkIcon?: (st: S) => IconType;
	isSelected: (item: T, state: S) => boolean;
	onSave: (selected: S) => void;
	formatItem: (item: T) => string;
	onItemSelect: (item: T, state: S) => S;
	closeOnSelect?: boolean;
};

export const SelectBottomModalContent = <T, S>({
	header,
	values,
	selected,
	onItemSelect,
	onSave,
	formatItem,
	isSelected,
	checkIcon,
	closeOnSelect,
}: Props<T, S>) => {
	const [selectedState, setSelectedState] = useState<S>(selected);
	styles.useVariants({ hasButtons: !closeOnSelect });

	const { dismiss } = useBottomSheetModal();
	useEffect(() => {
		setSelectedState(selected);
	}, [selected]);
	const onPress = useCallback(
		(t: T) => {
			setSelectedState((st) => {
				const st1 = onItemSelect(t, st);
				if (closeOnSelect) {
					onSave(st1);
					dismiss();
				}
				return st1;
			});
		},
		[onSave, setSelectedState, onItemSelect, dismiss],
	);
	return (
		<View style={styles.root}>
			<View style={styles.header}>
				{!closeOnSelect && (
					<Button
						icon={CloseIcon}
						size="small"
						onPress={() => {
							dismiss();
						}}
					/>
				)}
				{header && <Text content={header} variant="h4" />}

				{!closeOnSelect && (
					<Button
						icon={CheckIcon}
						size="small"
						onPress={() => {
							onSave(selectedState);
							dismiss();
						}}
					/>
				)}
			</View>
			<View style={styles.grid}>
				{values.map((value, idx) => (
					<Chip
						filled={isSelected(value, selectedState)}
						key={idx}
						title={formatItem(value)}
						onPress={() => onPress(value)}
						icon={
							isSelected(value, selectedState)
								? checkIcon?.(selectedState)
								: undefined
						}
					/>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%" },
	header: {
		width: "100%",
		alignItems: "center",
		flexDirection: "row",
		variants: {
			hasButtons: {
				true: {
					justifyContent: "space-between",
				},
				false: {
					justifyContent: "center",
				},
			},
		},
		gap: theme.gap(1),
		paddingHorizontal: theme.gap(1),
	},
	grid: {
		padding: theme.gap(2),
		paddingBottom: theme.gap(3),
		flexDirection: "row",
		gap: theme.gap(2),
		flexWrap: "wrap",
		justifyContent: "center",
	},
}));

export const SelectModalButton = <T, S>({
	buttonProps,
	...props
}: Props<T, S> & {
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
