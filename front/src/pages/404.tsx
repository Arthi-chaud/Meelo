import { NextPage } from 'next';
import ErrorPage from '../components/error-page';

const PageNotFound: NextPage = () => {
	return <ErrorPage heading="Oops... Page not found"/>;
};

export default PageNotFound;
