import { StaticHeader, useIosLargeTitle } from "~/components/header";
import { SettingsPage } from "~/pages/settings";

export default function SettingsView() {
	const { screenOptions, flashlistOptions } = useIosLargeTitle();
	return (
		<StaticHeader options={screenOptions}>
			{(scrollRef) => (
				<SettingsPage
					scrollRef={scrollRef}
					flashlistOptions={flashlistOptions}
				/>
			)}
		</StaticHeader>
	);
}
