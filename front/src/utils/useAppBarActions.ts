import { useSelector } from "react-redux";
import { RootState } from "../state/store";
import { useMemo } from "react";
import getAppBarActions from "../components/scaffold/actions";

/**
 * A simple hook to get/build AppBar Actions using the redux store
 */
const useAppBarActions = () => {
	const colorSchemeSetting = useSelector((state: RootState) => state.settings.colorScheme);
	const languageSetting = useSelector((state: RootState) => state.settings.language);
	const user = useSelector((state: RootState) => state.user.user);

	return useMemo(
		() => getAppBarActions(colorSchemeSetting, languageSetting, user?.admin ?? false),
		[colorSchemeSetting, languageSetting, user]
	);
};

export default useAppBarActions;
