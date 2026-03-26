import { GoToWebSettingsButton } from "~/components/go-to-web";
import { Section, SectionHeader } from "../components";

export const AdminSettings = () => {
	return (
		<Section>
			<SectionHeader title={"settings.users.admin"} />
			<GoToWebSettingsButton />
		</Section>
	);
};
