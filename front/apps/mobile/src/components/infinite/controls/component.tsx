import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { FilterControl } from "@/infinite-controls/filters/control";
import type { LayoutControl } from "@/infinite-controls/layout";
import type { SelectedSort, SortControl } from "@/infinite-controls/sort";
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

export const Controls = <SortingKey extends string>({
	layout,
	sort,
	filters,
	actions,
}: Props<SortingKey>) => {
	const { t } = useTranslation();
	return (
		<View style={styles.row}>
			<View style={styles.row}>
				{filters?.map((filter, idx) => (
					<SelectModalButton
						header={t("browsing.controls.filter.header")}
						key={idx}
						buttonProps={{
							title: t(filter.buttonLabel),
							icon: filter.buttonIcon as any,
							width: "fitContent",
							size: "small",
							iconPosition: "right",
						}}
						values={filter.values ?? []}
						selected={filter.selected}
						onItemSelect={(selected, st) => {
							if (filter.multipleChoice) {
								return st.includes(selected)
									? st.filter((k: any) => k !== selected)
									: [selected, ...st];
							} else {
								return st === selected ? null : selected;
							}
						}}
						isSelected={(item, st) =>
							filter.multipleChoice
								? st.includes(item)
								: st === item
						}
						formatItem={(item) => t(filter.formatItem(item))}
						onSave={(selected) => filter.onUpdate(selected)}
					/>
				))}
				{sort && (
					<SelectModalButton
						header={t("browsing.controls.sortBy")}
						values={sort.sortingKeys}
						selected={sort.selected}
						onItemSelect={(
							sortingKey,
							st,
						): SelectedSort<SortingKey> => {
							if (sortingKey === st.sort) {
								return {
									sort: sortingKey,
									order: st.order === "asc" ? "desc" : "asc",
								};
							} else {
								return { sort: sortingKey, order: "asc" };
							}
						}}
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
						isSelected={(item, st) => st.sort === item}
						checkIcon={({ order }) =>
							order === "desc" ? DescIcon : AscIcon
						}
						onSave={(selected) => sort.onUpdate(selected)}
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
