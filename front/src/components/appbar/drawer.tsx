import { HomeIcon } from "../icons";
import {
	Divider, Drawer, List,
	ListItem, ListItemButton, ListItemIcon, ListItemText
} from "@mui/material";
import { getTypeIcon, itemType } from "./item-types";
import Link from 'next/link';
import Action from "../actions/action";
import Translate from "../../i18n/translate";
import useAppBarActions from "../../utils/useAppBarActions";

interface DrawerProps {
	isOpen: boolean,
	onClose: () => void
}

const MeeloAppBarDrawer = (
	{ isOpen, onClose }: DrawerProps
) => {
	const actions = useAppBarActions();

	return (
		<Drawer
			elevation={8}
			PaperProps={{ sx: { width: '70%' } }}
			variant="temporary"
			open={isOpen}
			onClose={onClose}
			sx={{ display: { xs: 'block', md: 'none' } }}
		>
			<List>
				<Link href='/'>
					<ListItem disableGutters>
						<ListItemButton sx={{ borderRadius: '0' }} onClick={onClose}>
							<ListItemIcon><HomeIcon/></ListItemIcon>
							<ListItemText>
								<Translate translationKey="home"/>
							</ListItemText>
						</ListItemButton>
					</ListItem>
				</Link>
			</List>
			<Divider/>
			<List>
				{itemType.map((item, index) =>
					<Link key={item} href={`/${item}`}>
						<ListItemButton key={item} onClick={onClose} style={{ borderRadius: 0 }}>
							<ListItemIcon>
								{ getTypeIcon(item) }
							</ListItemIcon>
							<ListItemText
								primary={<Translate translationKey={item}/>}
							/>
						</ListItemButton>
					</Link>)}
			</List>
			<Divider />
			<List>
				{ actions.map((action: Action) => {
					const item = <ListItemButton
						key={action.label} disabled={action.disabled}
						style={{ borderRadius: 0 }}
						onClick={() => {
							action.onClick && action.onClick();
							onClose();
						}}
					>
						<ListItemIcon>{action.icon}</ListItemIcon>
						<ListItemText><Translate translationKey={action.label}/></ListItemText>
					</ListItemButton>;

					if (action.href && action.disabled !== true) {
						return <Link href={action.href} key={action.label}>
							{item}
						</Link>;
					}
					return item;
				})}
			</List>
		</Drawer>
	);
};

export default MeeloAppBarDrawer;
