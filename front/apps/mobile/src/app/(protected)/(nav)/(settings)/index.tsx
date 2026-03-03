import { StaticHeader } from "~/components/header";
import { SettingsPage } from "~/pages/settings";

export default function SettingsView() {
	return (
		<StaticHeader>
			<SettingsPage />
		</StaticHeader>
	);
}
