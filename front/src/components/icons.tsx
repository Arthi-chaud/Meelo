// eslint-disable-next-line no-restricted-imports
import * as Iconsax from 'iconsax-react';

type IconProps = Iconsax.IconProps;

export const PlaylistIcon = Iconsax.MusicFilter;
export const LibraryIcon = Iconsax.MusicLibrary2;
export const ReleaseIcon = Iconsax.Cd;
export const AlbumIcon = Iconsax.MusicDashboard;
export const ArtistIcon = Iconsax.Profile2User;
export const SongIcon = Iconsax.Musicnote;
export const TrackIcon = Iconsax.Musicnote;
export const LyricsIcon = Iconsax.MessageText;
export const VideoIcon = Iconsax.VideoSquare;
export const RelatedTracksIcon = Iconsax.Category;
export const CloseIcon = Iconsax.CloseCircle;
export const EditIcon = Iconsax.Edit2;
export const LogoutIcon = Iconsax.Logout;
export const DarkMode = Iconsax.Sun1;
export const LightMode = (props: IconProps) =>
	<Iconsax.Sun1 variant='Bold' {...props}/>;
export const AutoMode = Iconsax.Autobrightness;
export const TranslateIcon = Iconsax.Translate;
export const SettingsIcon = Iconsax.Setting2;
export const SearchIcon = Iconsax.SearchNormal1;
export const UpdateIllustrationIcon = Iconsax.Image;
export const BurgerIcon = Iconsax.HambergerMenu;
export const AddIcon = Iconsax.AddCircle;
export const DeleteIcon = Iconsax.Trash;
export const ShuffleIcon = Iconsax.Shuffle;
export const InfoIcon = Iconsax.InfoCircle;
export const AddToPlaylistIcon = Iconsax.MusicSquareAdd;
export const AddItemToPlaylistIcon = Iconsax.MusicSquareAdd;
export const PlayNextIcon = Iconsax.MusicSquareAdd;
export const PlayAfterIcon = Iconsax.MusicSquareAdd;
export const HomeIcon = Iconsax.Home2;
export const ExpandLessIcon = Iconsax.ArrowUp2;
export const ExpandMoreIcon = Iconsax.ArrowDown2;
export const ArchiveIcon = Iconsax.ArchiveBox;
export const DownloadIcon = Iconsax.DirectInbox;
export const ScanIcon = Iconsax.ArrowRotateRight;
export const CleanIcon = Iconsax.Broom;
export const MetadataRefreshIcon = Iconsax.Convertshape2;
export const MoreIcon = Iconsax.ArrowRight2;
export const MasterIcon = Iconsax.Star1;
export const ShareIcon = Iconsax.Share;
export const CheckIcon = Iconsax.TickCircle;
export const ContextualMenuIcon = (props: IconProps) =>
	<Iconsax.More {...props} style={{ rotate: '90deg' }} />;
export const UpgradeIcon = Iconsax.Star;
export const GridIcon = Iconsax.Category;
export const ListIcon = Iconsax.TextalignJustifycenter;
export const AscIcon = Iconsax.ArrowUp;
export const DescIcon = Iconsax.ArrowDown;
export const GoBackTopIcon = Iconsax.ArrowUp;
export const DragHandleIcon = Iconsax.HambergerMenu;

export const PlayIcon = Iconsax.ArrowRight3;
export const PlayCircledIcon = (props: IconProps) =>
	<Iconsax.PlayCircle {...props} variant="Bold" />;
export const PauseIcon = Iconsax.Pause;
export const RewindIcon = Iconsax.Previous;
export const ForwardIcon = Iconsax.Next;
export const FullscreenIcon = Iconsax.Maximize4;

export const DoneIcon = Iconsax.TickSquare;
