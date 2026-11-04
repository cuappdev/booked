import { themeColors } from './theme';
import { FacetKey } from '../models/Space';

export type TagType = FacetKey;

export const baseTagStyle = {
  fontSize: 14,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
};

const TAG_PALETTES: Record<TagType, { backgroundColor: string; color: string }> = {
  library: { backgroundColor: themeColors.cream[500], color: themeColors.bark[800] },
  spaceType: { backgroundColor: themeColors.sage[50], color: themeColors.sage[800] },
  reservationType: { backgroundColor: themeColors.mocha[100], color: themeColors.mocha[800] },
  soundLevel: { backgroundColor: themeColors.moss[50], color: themeColors.moss[800] },
  activity: { backgroundColor: themeColors.earth[50], color: themeColors.earth[800] },
  amenity: { backgroundColor: themeColors.clay[50], color: themeColors.clay[800] },
  audience: { backgroundColor: themeColors.bark[50], color: themeColors.bark[800] },
};

export const getTagStyle = (type: TagType) => TAG_PALETTES[type];
