import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { OpenExternalIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { Button } from "~/primitives/button";
import { Section, SectionHeader } from "../components";

export const AdminSettings = () => {
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	return (
		<Section>
			<SectionHeader title={"settings.users.admin"} />
			<Button
				title={t("settings.manageFromWebApp")}
				onPress={() =>
					openBrowserAsync(
						queryClient.api.urls.api.replace("/api", "/settings"),
					)
				}
				width="fill"
				icon={OpenExternalIcon}
				iconPosition="right"
				containerStyle={{ justifyContent: "center" }}
			/>
		</Section>
	);
};
