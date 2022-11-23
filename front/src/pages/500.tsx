import { NextPage } from 'next';
import ErrorPage from '../components/error-page';

const InternalError: NextPage = () => {
	return <ErrorPage heading="Oops... An error occured"/>;
};

export default InternalError;
