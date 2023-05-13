import ErrorPage from '../components/error-page';
import Translate from '../i18n/translate';

const InternalError = () => {
	return <ErrorPage
		heading={<Translate translationKey='errorOccured' />}
	/>;
};

export default InternalError;
