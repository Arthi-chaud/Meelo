import i18next from "i18next";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { CheckIcon, ExpandMoreIcon, UncheckIcon } from "@/ui/icons";
import { SelectModalButton } from "~/components/bottom-modal-sheet/select";
import { useColorScheme } from "~/hooks/color-scheme";
import { Languages } from "~/i18n";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { colorSchemePreference } from "~/state/color-scheme";
import { languagePreference } from "~/state/lang";
import {
	Section,
	SectionHeader,
	SectionRow,
	SectionRowTitle,
} from "../components";

export const InterfaceSettings = () => {
	return (
		<Section>
			<SectionHeader title={"settings.interface"} />
			<UseSystemThemeSettings />
			<UseDarkThemeSettings />
			<LanguageSettings />
		</Section>
	);
};

const UseSystemThemeSettings = () => {
	const actualColorScheme = useColorScheme();
	const [colorSchemePref, setColorSchemePref] = useAtom(
		colorSchemePreference,
	);
	return (
		<SectionRow
			heading={<SectionRowTitle title={"settings.ui.useSystemTheme"} />}
			action={
				<Pressable
					onPress={() => {
						if (colorSchemePref === "system") {
							setColorSchemePref(actualColorScheme);
						} else {
							setColorSchemePref("system");
						}
					}}
				>
					<Icon
						variant={
							colorSchemePref === "system" ? "Bold" : "Outline"
						}
						icon={
							colorSchemePref === "system"
								? CheckIcon
								: UncheckIcon
						}
					/>
				</Pressable>
			}
		/>
	);
};

const UseDarkThemeSettings = () => {
	const actualColorScheme = useColorScheme();
	const [colorSchemePref, setColorSchemePref] = useAtom(
		colorSchemePreference,
	);
	return (
		<SectionRow
			heading={<SectionRowTitle title="settings.ui.useDarkTheme" />}
			action={
				<Pressable
					disabled={colorSchemePref === "system"}
					onPress={() => {
						setColorSchemePref(
							colorSchemePref === "dark" ? "light" : "dark",
						);
					}}
				>
					<Icon
						style={
							colorSchemePref === "system"
								? styles.disabledCheckButton
								: undefined
						}
						icon={
							actualColorScheme === "dark"
								? CheckIcon
								: UncheckIcon
						}
					/>
				</Pressable>
			}
		/>
	);
};

const LanguageSettings = () => {
	const { t } = useTranslation();
	const [lng, setLng] = useAtom(languagePreference);
	return (
		<SectionRow
			heading={<SectionRowTitle title={"settings.ui.language"} />}
			action={
				<SelectModalButton
					header={t("settings.ui.language")}
					closeOnSelect
					values={Languages}
					selected={lng}
					buttonProps={{
						title: t(
							`settings.ui.lang.${i18next.language as "en"}`,
						),
						width: "fitContent",
						icon: ExpandMoreIcon,
						iconPosition: "right",
						size: "small",
					}}
					isSelected={(l, selectedLng) => l === selectedLng}
					onItemSelect={(l) => l}
					onSave={setLng}
					formatItem={(item) =>
						t(`settings.ui.lang.${item}`, {
							lng: item,
						})
					}
				/>
			}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	disabledCheckButton: { color: theme.colors.text.secondary },
}));
