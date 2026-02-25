import { useAtomValue } from "jotai";
import { type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native-unistyles";
import { getCurrentUserStatus } from "@/api/queries";
import { useQuery } from "~/api";
import { SafeFlashList } from "~/components/safe-view";
import { Divider } from "~/primitives/divider";
import { otherInstancesAtom } from "~/state/user";
import { canDownload } from "~/utils/can-download";
import { AdminSettings } from "./sections/admin";
import { CacheSettings } from "./sections/cache";
import { InstancesSettings } from "./sections/instances";
import { InterfaceSettings } from "./sections/interface";
import { MiscSection } from "./sections/misc";
import { ServiceVersionsSettings } from "./sections/service-versions";

export const SettingsPage = () => {
	const { data: user } = useQuery(getCurrentUserStatus);
	const otherInstances = useAtomValue(otherInstancesAtom);
	const sections = useMemo(() => {
		const sections: (() => ReactNode)[] = [];
		sections.push(InterfaceSettings);
		if (canDownload()) {
			sections.push(CacheSettings);
		}
		if (user?.admin) {
			sections.push(AdminSettings);
		}
		if (otherInstances.length > 0) {
			sections.push(InstancesSettings);
		}
		sections.push(MiscSection);
		sections.push(ServiceVersionsSettings);
		return sections;
	}, [user, otherInstances]);
	return (
		<SafeFlashList
			data={sections}
			contentContainerStyle={[styles.root]}
			renderItem={({ item: Section }) => <Section />}
			ItemSeparatorComponent={() => <Divider h />}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { paddingHorizontal: theme.gap(1) },
}));
