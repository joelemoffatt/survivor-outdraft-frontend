import { getImportedCastawayImage } from '../constants/importedCastawayImages';

const formatVersionSeason = (season: number): string => {
  return `US${String(season).padStart(2, '0')}`;
};

export const getImportedCastawayImageKey = (season?: number | null, jsonId?: string | null): string | null => {
  if (!season || !jsonId) {
    return null;
  }

  const trimmedJsonId = jsonId.trim();
  if (!trimmedJsonId) {
    return null;
  }

  return `${formatVersionSeason(season)}${trimmedJsonId}`;
};

export const getImportedCastawayImageSource = (
  season?: number | null,
  jsonId?: string | null,
): number | null => {
  const key = getImportedCastawayImageKey(season, jsonId);
  if (!key) {
    return null;
  }

  return getImportedCastawayImage(key);
};
