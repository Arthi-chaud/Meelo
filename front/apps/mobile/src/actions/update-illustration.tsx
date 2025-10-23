import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CheckIcon, UpdateIllustrationIcon } from "@/ui/icons";
import { useModal } from "~/components/bottom-modal-sheet";
import type { ContextMenuItem } from "~/components/context-menu";
import { Button } from "~/primitives/button";
import { TextInput } from "~/primitives/text_input";

export const useUpdateIllustrationAction = (
	onConfirm: (illustrationUrl: string) => void,
): ContextMenuItem => {
	const { dismiss } = useBottomSheetModal();
	const onFormCompletion = (illustrationUrl: string) => {
		onConfirm(illustrationUrl);
		dismiss();
	};
	const content = useCallback(() => {
		return <UpdateIllustrationForm onConfirm={onFormCompletion} />;
	}, [onConfirm]);
	const { openModal } = useModal({
		content,
		onDismiss: () => {},
	});

	return {
		label: "actions.changeIllutration",
		onPress: openModal,
		icon: UpdateIllustrationIcon,
	};
};

const UpdateIllustrationForm = ({
	onConfirm,
}: {
	onConfirm: (illustrationUrl: string) => void;
}) => {
	const { t } = useTranslation();
	const defaultValues = { url: "" };
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm({ defaultValues });
	return (
		<View style={styles.root}>
			<Controller
				control={control}
				name="url"
				rules={{
					required: true,
				}}
				render={({ field: { onChange, onBlur, value } }) => (
					<TextInput
						placeholder={t("form.illustration.url")}
						textContentType="URL"
						autoCorrect={false}
						autoCapitalize="none"
						onBlur={onBlur}
						onChangeText={onChange}
						error={errors.url?.message}
						value={value}
					/>
				)}
			/>
			<Button
				icon={CheckIcon}
				width="fitContent"
				title={t("form.confirm")}
				onPress={handleSubmit(({ url }) => onConfirm(url))}
			/>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { gap: theme.gap(2), width: "100%", alignItems: "center" },
}));
