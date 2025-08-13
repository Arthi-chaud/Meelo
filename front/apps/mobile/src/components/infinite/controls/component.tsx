import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { FilterControl } from "@/infinite-controls/filters/control";
import type { LayoutControl } from "@/infinite-controls/layout";
import type { SortControl } from "@/infinite-controls/sort";
import { AscIcon, DescIcon, GridIcon, ListIcon } from "@/ui/icons";
import type { Action } from "~/actions";
import { SelectModalButton } from "~/components/bottom-modal-sheet/select";
import { Button } from "~/primitives/button";

type Props<SortingKey extends string> = {
	layout?: LayoutControl;
	sort?: SortControl<SortingKey>;
	filters?: FilterControl<any>[];
	actions?: Omit<Action, "href">[];
};

export const Controls = <S extends string>({
	layout,
	sort,
	filters,
	actions,
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
				<SelectModalButton
					header={t("browsing.controls.filter.header")}
					key={idx}
					closeOnSelect
					buttonProps={{
						title: t(filter.buttonLabel),
						icon: filter.buttonIcon as any,
						size: "small",
						iconPosition: "right",
					}}
					values={filter.values ?? []}
					isSelected={(item) =>
						filter.multipleChoice
							? filter.selected.includes(item)
							: filter.selected === item
					}
					formatItem={(item) => t(filter.formatItem(item))}
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
				/>
			))}
			{sort && (
				<SelectModalButton
					header={t("browsing.controls.sortBy")}
					closeOnSelect
					values={sort.sortingKeys}
					formatItem={(item) => t(sort.formatItem(item))}
					buttonProps={{
						title: t(sort.formatItem(sort.selected.sort)),
						size: "small",
						icon:
							sort.selected.order === "asc" ? AscIcon : DescIcon,
						iconPosition: "left",
					}}
					isSelected={(item) => sort.selected.sort === item}
					checkIcon={OrderIcon}
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
				/>
			)}
			{layout && (
				<Button
					size="small"
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
			{actions?.map((action, idx) => (
				<Button
					size="small"
					key={idx}
					icon={action.icon}
					title={t(action.label)}
					onPress={() => {
						action.onPress?.();
					}}
				/>
			))}
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
}));
