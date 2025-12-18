import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
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
	const OrderIcon = sort?.selected.order === "desc" ? DescIcon : AscIcon;
	return (
		<View style={styles.row}>
			<View style={styles.row}>
				{filters?.map((filter, idx) => (
					<SelectModalButton
						header={t("browsing.controls.filter.header")}
						key={idx}
						closeOnSelect
						buttonProps={{
							title: t(filter.buttonLabel),
							icon: filter.buttonIcon as any,
							width: "fitContent",
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
									? filter.selected.filter(
											(k) => k !== selected,
										)
									: [selected, ...filter.selected];
								filter.onUpdate(selectedKeys);
							} else {
								filter.onUpdate(
									filter.selected === selected
										? null
										: selected,
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
							width: "fitContent",
							size: "small",
							icon:
								sort.selected.order === "asc"
									? AscIcon
									: DescIcon,
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
						width="fitContent"
						icon={layout.layout === "list" ? GridIcon : ListIcon}
						containerStyle={styles.button}
						onPress={() => {
							layout.onUpdate({
								layout:
									layout.layout === "list" ? "grid" : "list",
								itemSize: layout.itemSize,
							});
						}}
					/>
				)}
			</View>
			<View style={[styles.row, styles.unbreakableRow]}>
				{actions?.map((action, idx) => (
					<Button
						size="small"
						width="fitContent"
						key={idx}
						icon={action.icon}
						title={t(action.label)}
						onPress={() => {
							action.onPress?.();
						}}
					/>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	row: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	unbreakableRow: {
		flexWrap: "nowrap",
	},
	button: { elevation: 10 },
}));
