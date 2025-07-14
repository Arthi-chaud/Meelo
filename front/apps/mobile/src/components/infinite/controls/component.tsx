import type { FilterControl } from "@/infinite-controls/filters/control";
import type { LayoutControl } from "@/infinite-controls/layout";
import type { SortControl } from "@/infinite-controls/sort";
import { AscIcon, CheckIcon, DescIcon, GridIcon, ListIcon } from "@/ui/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Text } from "~/primitives/text";

//TODO Actions
//TODO Height of buttons is not consistent
//TODO Handle horizontal overflow

// TODO: the external library feels shaky
// + causes us to do ugly workarind in styling (see infinite view's styling)
// We could implement the dropdown ourselves

type Props<SortingKey extends string> = {
	layout?: LayoutControl;
	sort?: SortControl<SortingKey>;
	filters?: FilterControl<any>[];
};

export const Controls = <S extends string>({
	layout,
	sort,
	filters,
}: Props<S>) => {
	const { t } = useTranslation();
	const OrderIcon = withUnistyles(
		sort?.selected.order === "desc" ? DescIcon : AscIcon,
		(theme) => ({
			color: theme.colors.text.primary,
			size: theme.fontSize.rem(1),
		}),
	);
	return (
		<View style={styles.root}>
			{filters?.map((filter, idx) => (
				<SelectDropdown
					key={idx}
					data={[...(filter.values ?? [])]}
					onSelect={(selected) => {
						if (filter.multipleChoice) {
							const selectedKeys = filter.selected.includes(
								selected,
							)
								? filter.selected.filter((k) => k !== selected)
								: [selected, ...filter.selected];
							filter.onUpdate(selectedKeys);
						} else {
							filter.onUpdate(
								filter.selected === selected ? null : selected,
							);
						}
					}}
					dropdownStyle={styles.dropdownContainer}
					renderItem={(item) => (
						<View style={styles.dropdownItem}>
							<View style={styles.dropdownItemRow}>
								<View style={styles.dropdownItemIcon}>
									{(
										filter.multipleChoice
											? filter.selected.includes(item)
											: filter.selected === item
									) ? (
										<Icon icon={CheckIcon} />
									) : undefined}
								</View>

								<View style={styles.dropdownItemLabel}>
									<Text
										content={t(filter.formatItem(item))}
									/>
								</View>
							</View>

							<Divider h />
						</View>
					)}
					statusBarTranslucent
					dropdownOverlayColor="transparent"
					renderButton={() => (
						<View>
							{/* If there is not parent view, the button is now displayed, shrug*/}
							<Button
								icon={filter.buttonIcon as any}
								propagateToParent
								iconPosition="right"
								title={t(filter.buttonLabel)}
							/>
						</View>
					)}
				/>
			))}
			{sort && (
				<SelectDropdown
					data={[...sort.sortingKeys]}
					onSelect={(selected: S) => {
						if (selected === sort.selected.sort) {
							sort.onUpdate({
								sort: selected,
								order:
									sort.selected.order === "asc"
										? "desc"
										: "asc",
							});
						} else {
							sort.onUpdate({ sort: selected, order: "asc" });
						}
					}}
					dropdownStyle={styles.dropdownContainer}
					renderItem={(item) => (
						<View style={styles.dropdownItem}>
							<View style={styles.dropdownItemRow}>
								<View style={styles.dropdownItemIcon}>
									{sort.selected.sort === item ? (
										<OrderIcon />
									) : undefined}
								</View>

								<View style={styles.dropdownItemLabel}>
									<Text content={t(sort.formatItem(item))} />
								</View>
							</View>

							<Divider h />
						</View>
					)}
					statusBarTranslucent
					dropdownOverlayColor="transparent"
					renderButton={() => (
						<View>
							{/* If there is not parent view, the button is now displayed, shrug*/}
							<Button
								icon={
									sort.selected.order === "asc"
										? AscIcon
										: DescIcon
								}
								propagateToParent
								iconPosition="right"
								title={t(sort.formatItem(sort.selected.sort))}
							/>
						</View>
					)}
				/>
			)}
			{layout && (
				<Button
					icon={layout.layout === "list" ? GridIcon : ListIcon}
					containerStyle={styles.button}
					onPress={() => {
						layout.onUpdate({
							layout: layout.layout === "list" ? "grid" : "list",
							itemSize: layout.itemSize,
						});
					}}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	button: { elevation: 10 },
	dropdownContainer: {
		borderRadius: theme.borderRadius,
		width: 150,
		gap: theme.gap(2),
	},
	dropdownItem: { backgroundColor: theme.colors.background },
	dropdownItemRow: {
		display: "flex",
		flexDirection: "row",
		gap: theme.gap(1),
		padding: theme.gap(1),
	},
	dropdownItemIcon: {
		flex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	dropdownItemLabel: {
		flex: 5,
		display: "flex",
		alignItems: "flex-start",
	},
}));
