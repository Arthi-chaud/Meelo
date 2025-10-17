/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @ts-nocheck

import * as Iconsax from "@wandersonalwes/iconsax-react";

export type Icon = React.FunctionComponent<IconProps>;
export type IconProps = Iconsax.IconProps;

export const TranscodeIcon: Icon = Iconsax.Polyswarm;
export const PlaylistIcon: Icon = Iconsax.MusicFilter;
export const LibraryIcon: Icon = Iconsax.MusicLibrary2;
export const ReleaseIcon: Icon = Iconsax.Cd;
export const AlbumIcon: Icon = Iconsax.MusicDashboard;
export const ArtistIcon: Icon = Iconsax.Profile2User;
export const SongIcon: Icon = Iconsax.Musicnote;
export const GenreIcon: Icon = Iconsax.Speaker;
export const RadioIcon: Icon = Iconsax.Radio;
export const PlayerIcon: Icon = Iconsax.PlayCircle;
export const CompilationIcon: Icon = Iconsax.Category;
export const TrackIcon: Icon = Iconsax.Musicnote;
export const LyricsIcon: Icon = Iconsax.MessageText;
export const VideoIcon: Icon = Iconsax.VideoSquare;
export const RelatedTracksIcon: Icon = Iconsax.Category;
export const CloseIcon: Icon = Iconsax.CloseCircle;
export const EditIcon: Icon = Iconsax.Edit2;
export const ReorderPlaylistIcon: Icon = Iconsax.ReceiptEdit;
export const LogoutIcon: Icon = Iconsax.Logout;
export const DarkMode: Icon = Iconsax.Sun1;
export const ProviderIcon: Icon = Iconsax.Global;
export const LightMode: Icon = (props: IconProps) => (
	<Iconsax.Sun1 variant="Bold" {...props} />
);
export const AutoMode: Icon = Iconsax.Autobrightness;
export const TranslateIcon: Icon = Iconsax.Translate;
export const SettingsIcon: Icon = Iconsax.Setting2;
export const SearchIcon: Icon = Iconsax.SearchNormal1;
export const BrowseIcon: Icon = Iconsax.MusicSquare;
export const UpdateIllustrationIcon: Icon = Iconsax.Image;
export const BurgerIcon: Icon = Iconsax.HambergerMenu;
export const AddIcon: Icon = Iconsax.AddCircle;
export const DeleteIcon: Icon = Iconsax.Trash;
export const ShuffleIcon: Icon = Iconsax.Shuffle;
export const InfoIcon: Icon = (props: IconProps) => (
	<Iconsax.InfoCircle style={{ rotate: "180deg" }} {...props} />
);
export const AddToPlaylistIcon: Icon = Iconsax.MusicSquareAdd;
export const AddItemToPlaylistIcon: Icon = Iconsax.MusicSquareAdd;
export const PlayNextIcon: Icon = Iconsax.MusicSquareAdd;
export const PlayAfterIcon: Icon = Iconsax.MusicSquareAdd;
export const HomeIcon: Icon = Iconsax.Home2;
export const ExpandLessIcon: Icon = Iconsax.ArrowUp2;
export const ExpandMoreIcon: Icon = Iconsax.ArrowDown2;
export const BackIcon: Icon = Iconsax.ArrowLeft2;
export const ArchiveIcon: Icon = Iconsax.ArchiveBox;
export const DownloadIcon: Icon = Iconsax.DirectInbox;
export const ScanIcon: Icon = Iconsax.ArrowRotateRight;
export const CleanIcon: Icon = Iconsax.Broom;
export const MetadataRefreshIcon: Icon = Iconsax.Convertshape2;
export const MoreIcon: Icon = Iconsax.ArrowRight2;
export const MasterIcon: Icon = Iconsax.Star1;
export const StarIcon: Icon = Iconsax.Star1;
export const MovingStarIcon: Icon = Iconsax.Star;
export const ShareIcon: Icon = Iconsax.Share;
export const CheckIcon: Icon = Iconsax.TickCircle;
export const UncheckIcon: Icon = Iconsax.CloseCircle;
export const ContextualMenuIcon: Icon = (props: IconProps) => (
	<Iconsax.More
		{...props}
		style={{ rotate: "90deg", ...props.style }}
		size={18}
	/>
);
export const UpgradeIcon: Icon = Iconsax.Star;
export const GridIcon: Icon = Iconsax.Category;
export const ListIcon: Icon = Iconsax.TextalignJustifycenter;
export const AscIcon: Icon = Iconsax.ArrowUp;
export const DescIcon: Icon = Iconsax.ArrowDown;
export const GoBackTopIcon: Icon = Iconsax.ArrowUp;
export const DragHandleIcon: Icon = Iconsax.HambergerMenu;

export const PlayIcon: Icon = Iconsax.ArrowRight3;
export const PauseIcon: Icon = Iconsax.Pause;
export const RewindIcon: Icon = Iconsax.Previous;
export const ForwardIcon: Icon = Iconsax.Next;
export const FullscreenIcon: Icon = Iconsax.Maximize4;
export const PlusIcon: Icon = Iconsax.Add;
export const MinusIcon: Icon = Iconsax.Minus;
export const DoneIcon: Icon = Iconsax.TickSquare;

export const EmptyStateIcon: Icon = Iconsax.SearchStatus1;

export const MergeIcon: Icon = Iconsax.Hierarchy;

export const ErrorIcon: Icon = Iconsax.CloseCircle;

export const OpenExternalIcon: Icon = Iconsax.ExportCircle;
export const WarningIcon: Icon = Iconsax.Warning2;
export const BookIcon: Icon = Iconsax.Book1;
// Icons for song type
export const SongTypeOriginalIcon: Icon = Iconsax.Music;
export const SongTypeRemixIcon: Icon = Iconsax.Repeat;
export const SongTypeLiveIcon: Icon = Iconsax.Microphone2;
export const SongTypeAcousticIcon: Icon = Iconsax.VoiceSquare;
export const SongTypeInstrumentalIcon: Icon = Iconsax.Musicnote;
export const SongTypeEditIcon: Icon = Iconsax.Cut;
export const SongTypeCleanIcon: Icon = Iconsax.TickCircle;
export const SongTypeDemoIcon: Icon = Iconsax.ReceiptEdit;
export const SongTypeAcapellaIcon: Icon = Iconsax.VoiceCricle;
export const SongTypeMedleyIcon: Icon = Iconsax.Layer;
export const SongTypeNonMusicIcon: Icon = Iconsax.VolumeSlash;

export const SongTypeIcon = (type: SongType) => {
	switch (type) {
		case "Original":
			return SongTypeOriginalIcon;
		case "Remix":
			return SongTypeRemixIcon;
		case "Live":
			return SongTypeLiveIcon;
		case "Acoustic":
			return SongTypeAcousticIcon;
		case "Instrumental":
			return SongTypeInstrumentalIcon;
		case "Edit":
			return SongTypeEditIcon;
		case "Clean":
			return SongTypeCleanIcon;
		case "Demo":
			return SongTypeDemoIcon;
		case "Acappella":
			return SongTypeAcapellaIcon;
		case "Medley":
			return SongTypeMedleyIcon;
		case "NonMusic":
			return SongTypeNonMusicIcon;
		default:
			return SongIcon;
	}
};
