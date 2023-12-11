import {
	Checkbox, Grid, MenuItem, Select
} from "@mui/material";
import Translate, { useLanguage } from "../../i18n/translate";
import SectionHeader from "../section-header";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import useColorScheme from "../../theme/color-scheme";
import {
	resetLanguage, setColorScheme, setLanguage
} from "../../state/settingsSlice";
import { Language, Languages } from "../../i18n/i18n";

const SettingGroupStyle = {
	paddingTop: 1, paddingBottom: 2,
	rowSpacing: 4,
} as const;

const InputContainerStyle = { justifyContent: 'flex-end', display: 'flex' } as const;

const UserSettings = () => {
	const colorSchemePreference = useSelector((state: RootState) => state.settings.colorScheme);
	const actualColorScheme = useColorScheme();
	const languagePreference = useSelector((state: RootState) => state.settings.language);
	const dispatch = useDispatch();
	const actualLanguage = useLanguage();

	return <>
		<SectionHeader
			heading={<Translate translationKey='colorScheme'/>}
		/>
		<Grid container sx={SettingGroupStyle}>
			<Grid item xs={11}>
				<Translate translationKey="useSystemeTheme"/>
			</Grid>
			<Grid item xs={1} sx={InputContainerStyle}>
				<Checkbox
					onChange={(event, isChecked) =>
						dispatch(setColorScheme(
							isChecked ? 'system' : actualColorScheme
						))
					}
					checked={colorSchemePreference == 'system'}
				/>
			</Grid>
			<Grid item xs={11}>
				<Translate translationKey="useDarkTheme"/>
			</Grid>
			<Grid item xs={1} sx={InputContainerStyle}>
				<Checkbox
					onChange={(event, isChecked) =>
						dispatch(setColorScheme(
							isChecked ? 'dark' : 'light'
						))
					}
					disabled={colorSchemePreference === 'system'}
					checked={actualColorScheme === 'dark'}
				/>
			</Grid>
		</Grid>
		<SectionHeader
			heading={<Translate translationKey='language'/>}
		/>
		<Grid container sx={SettingGroupStyle}>
			<Grid item xs={11}>
				<Translate translationKey="useSystemeLanguage"/>
			</Grid>
			<Grid item xs={1} sx={InputContainerStyle}>
				<Checkbox
					onChange={(event, isChecked) =>
						dispatch(isChecked
							? resetLanguage()
							: setLanguage(actualLanguage))
					}
					checked={languagePreference == 'system'}
				/>
			</Grid>
			<Grid item xs={10}>
				<Translate translationKey="language"/>
			</Grid>
			<Grid item xs={2} sx={InputContainerStyle}>
				<Select
					disabled={languagePreference == 'system'}
					size="small"
					value={actualLanguage}
					onChange={(event) => {
						dispatch(setLanguage(
							event.target.value as Language
						));
					}}
				>
					{Languages.map((language, languageIndex) => (
						<MenuItem key={languageIndex} value={language} style={{ borderRadius: 0 }}>
							<Translate translationKey={language}/>
						</MenuItem>
					))}
				</Select>
			</Grid>
		</Grid>
	</>;
};

export default UserSettings;
