import {
	Button, Divider, Grid
} from '@mui/material';
import { HookTextField, useHookForm } from 'mui-react-hook-form-plus';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import API from '../../api/api';
import { setAccessToken } from '../../state/userSlice';
import Translate, { translate, useLanguage } from '../../i18n/translate';

/**
 * Authentication form
 * On successful authentication, update store with access token
 */
const AuthenticationForm = () => {
	const dispatch = useDispatch();
	const [formType, setFormType] = useState<'login' | 'signup'>('login');
	const defaultValues = { username: '', password: '', confirm: '' };
	const [password, setPassword] = useState(defaultValues.password);
	const { registerState, handleSubmit } = useHookForm({
		defaultValues,
	});
	const language = useLanguage();

	const onSubmit = async (values: typeof defaultValues) => {
		try {
			if (formType == 'signup') {
				const createdUser = await API.register(values);

				if (!createdUser.enabled) {
					setFormType('login');
					toast.success(translate('accountCreated'));
					return;
				}
			}
			dispatch(setAccessToken((await API.login(values)).access_token));
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', height: '100%' }}>
			<Grid container direction='column' spacing={3}
				sx={{
					display: 'flex', height: '100%', width: '100%',
					justifyContent: 'center', alignItems: 'center',
					flexWrap: 'nowrap'
				}}
			>
				<HookTextField
					{...registerState('username')}
					textFieldProps={{
						label: <Translate translationKey='username'/>,
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: translate('usernameIsRequired')
						},
						minLength: {
							value: 4,
							message: translate('usernameTooShort')
						}
					}}
				/>
				<HookTextField
					{...registerState('password')}
					textFieldProps={{
						label: <Translate translationKey='password'/>,
						type: 'password',
						onChange: (event) => setPassword(event.target.value)
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: translate('passwordIsRequired')
						},
						minLength: {
							value: 6,
							message: translate('passwordTooShort')
						}
					}}
				/>
				{ formType == 'signup' &&
				<HookTextField
					{...registerState('confirm')}
					textFieldProps={{
						label: <Translate translationKey='confirmPassword'/>,
						type: 'password',
					}}
					gridProps={{}}
					rules={{
						required: {
							value: true,
							message: translate('pleaseConfirm')
						},
						validate: (confirmValue) => {
							if (confirmValue !== password) {
								return translate('passwordsAreDifferent');
							}
						}
					}}
				/>
				}
				<Grid item>
					<Button type="submit" variant='contained' onClick={() => {}}>
						{formType == 'login' ? 'Login' : 'Signup'}
					</Button>
				</Grid>
				<Divider sx={{ width: '100%', paddingY: 1 }} variant='middle'/>
				<Grid item>
					<Button variant='outlined'
						onClick={() => setFormType(formType == 'login' ? 'signup' : 'login')}
					>
						<Translate translationKey={formType == 'login' ? 'signupButton' : 'signinButton'}/>
					</Button>
				</Grid>
			</Grid>
		</form>
	);
};

export default AuthenticationForm;
