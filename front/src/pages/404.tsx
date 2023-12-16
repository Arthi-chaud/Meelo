import ErrorPage from "../components/error-page";
import Translate from "../i18n/translate";

const PageNotFound = () => {
	return <ErrorPage heading={<Translate translationKey="pageNotFound" />} />;
};

export default PageNotFound;
