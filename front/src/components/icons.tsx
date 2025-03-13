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

import * as Iconsax from "iconsax-react";

export type IconProps = Iconsax.IconProps;

export const TranscodeIcon = Iconsax.Polyswarm;
export const PlaylistIcon = Iconsax.MusicFilter;
export const LibraryIcon = Iconsax.MusicLibrary2;
export const ReleaseIcon = Iconsax.Cd;
export const AlbumIcon = Iconsax.MusicDashboard;
export const ArtistIcon = Iconsax.Profile2User;
export const SongIcon = Iconsax.Musicnote;
export const PlayerIcon = Iconsax.PlayCircle;
export const CompilationIcon = Iconsax.Category;
export const TrackIcon = Iconsax.Musicnote;
export const LyricsIcon = Iconsax.MessageText;
export const VideoIcon = Iconsax.VideoSquare;
export const RelatedTracksIcon = Iconsax.Category;
export const CloseIcon = Iconsax.CloseCircle;
export const EditIcon = Iconsax.Edit2;
export const LogoutIcon = Iconsax.Logout;
export const DarkMode = Iconsax.Sun1;
export const ProviderIcon = Iconsax.Global;
export const LightMode = (props: IconProps) => (
	<Iconsax.Sun1 variant="Bold" {...props} />
);
export const AutoMode = Iconsax.Autobrightness;
export const TranslateIcon = Iconsax.Translate;
export const SettingsIcon = Iconsax.Setting2;
export const SearchIcon = Iconsax.SearchNormal1;
export const UpdateIllustrationIcon = Iconsax.Image;
export const BurgerIcon = Iconsax.HambergerMenu;
export const AddIcon = Iconsax.AddCircle;
export const DeleteIcon = Iconsax.Trash;
export const ShuffleIcon = Iconsax.Shuffle;
export const InfoIcon = (props: IconProps) => (
	<Iconsax.InfoCircle style={{ rotate: "180deg" }} {...props} />
);
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
export const ContextualMenuIcon = (props: IconProps) => (
	<Iconsax.More {...props} style={{ rotate: "90deg" }} size={18} />
);
export const UpgradeIcon = Iconsax.Star;
export const GridIcon = Iconsax.Category;
export const ListIcon = Iconsax.TextalignJustifycenter;
export const AscIcon = Iconsax.ArrowUp;
export const DescIcon = Iconsax.ArrowDown;
export const GoBackTopIcon = Iconsax.ArrowUp;
export const DragHandleIcon = Iconsax.HambergerMenu;

export const PlayIcon = Iconsax.ArrowRight3;
export const PauseIcon = Iconsax.Pause;
export const RewindIcon = Iconsax.Previous;
export const ForwardIcon = Iconsax.Next;
export const FullscreenIcon = Iconsax.Maximize4;
export const PlusIcon = Iconsax.Add;
export const MinusIcon = Iconsax.Minus;

export const DoneIcon = Iconsax.TickSquare;

export const EmptyStateIcon = Iconsax.SearchStatus1;

// Icons for song type
export const SongTypeOriginalIcon = Iconsax.Music;
export const SongTypeRemixIcon = Iconsax.Repeat;
export const SongTypeLiveIcon = Iconsax.Microphone2;
export const SongTypeAcousticIcon = Iconsax.VoiceSquare;
export const SongTypeInstrumentalIcon = Iconsax.Musicnote;
export const SongTypeEditIcon = Iconsax.Cut;
export const SongTypeCleanIcon = Iconsax.TickCircle;
export const SongTypeDemoIcon = Iconsax.ReceiptEdit;
export const SongTypeAcapellaIcon = Iconsax.VoiceCricle;
export const SongTypeMedleyIcon = Iconsax.Layer;
export const SongTypeNonMusicIcon = Iconsax.VolumeSlash;
