import { openBrowserAsync } from "expo-web-browser";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { OpenExternalIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { Button } from "~/primitives/button";

// NOTE: Should only be displayed if the user is admin
export const GoToWebSettingsButton = (buttonProps: {
	buttonProps?: Partial<ComponentProps<typeof Button>>;
}) => {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	return (
		<Button
			title={t("settings.manageFromWebApp")}
			onPress={() =>
				openBrowserAsync(
					queryClient.api.urls.api.replace("/api", "/settings"),
				)
			}
			icon={OpenExternalIcon}
			iconPosition="right"
			width="fill"
			containerStyle={{ justifyContent: "center" }}
			{...buttonProps}
		/>
	);
};
