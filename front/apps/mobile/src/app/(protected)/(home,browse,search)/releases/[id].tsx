import { useLocalSearchParams } from "expo-router";
import ReleasePage from "~/pages/release";

export default function Page() {
	const { id: releaseId } = useLocalSearchParams<{ id: string }>();

	return <ReleasePage releaseId={releaseId} />;
}
