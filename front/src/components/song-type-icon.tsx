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

import { Box, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { type SongType } from "../models/song";
import {
    SongIcon,
    SongTypeAcapellaIcon,
    SongTypeAcousticIcon,
    SongTypeCleanIcon,
    SongTypeDemoIcon,
    SongTypeEditIcon,
    SongTypeInstrumentalIcon,
    SongTypeLiveIcon,
    SongTypeMedleyIcon,
    SongTypeNonMusicIcon,
    SongTypeRemixIcon
} from "./icons";

const SongTypeIcon = ({ type, size = 20 }: { type: SongType; size?: number }) => {
    const { t } = useTranslation();

    const getIcon = () => {
        switch (type) {
            // We don't show an icon for original songs, since that's the most common type
            case 'Original': return null;
            case 'Remix': return <SongTypeRemixIcon size={size} />;
            case 'Live': return <SongTypeLiveIcon size={size} />;
            case 'Acoustic': return <SongTypeAcousticIcon size={size} />;
            case 'Instrumental': return <SongTypeInstrumentalIcon size={size} />;
            case 'Edit': return <SongTypeEditIcon size={size} />;
            case 'Clean': return <SongTypeCleanIcon size={size} />;
            case 'Demo': return <SongTypeDemoIcon size={size} />;
            case 'Acappella': return <SongTypeAcapellaIcon size={size} />;
            case 'Medley': return <SongTypeMedleyIcon size={size} />;
            case 'NonMusic': return <SongTypeNonMusicIcon size={size} />;
            default: return <SongIcon size={size} />;
        }
    };

    const icon = getIcon();
    if (!icon) return null;

    return (
        <Tooltip title={t(type) as string} arrow>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', marginRight: 1, opacity: 0.8 }}>
                {icon}
            </Box>
        </Tooltip>
    );
};

export default SongTypeIcon;