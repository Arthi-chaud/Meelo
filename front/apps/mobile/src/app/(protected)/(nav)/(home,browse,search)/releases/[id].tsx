import { useLocalSearchParams } from "expo-router";
import { FadingHeader } from "~/components/fading-header";
import ReleasePage from "~/pages/release";

export default function Page() {
	const { id: releaseId } = useLocalSearchParams<{ id: string }>();

	return (
		<FadingHeader>
			{(scrollProps) => (
				<ReleasePage releaseId={releaseId} scrollProps={scrollProps} />
			)}
		</FadingHeader>
	);
}
