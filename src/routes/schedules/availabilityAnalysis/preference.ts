import { PreferenceType } from "../../../database";

export const initPreference = () => {
  const preference = new Map<PreferenceType, Set<string>>();
  for (const preferenceType of Object.keys(PreferenceType)) {
    if (!isNaN(Number(preferenceType))) {
      preference.set(Number(preferenceType), new Set<string>());
    }
  }
  return preference;
};

export const getCopy = (preference: Map<PreferenceType, Set<string>>) => {
  const copy = new Map<PreferenceType, Set<string>>();
  for (const [preferenceType, users] of preference) {
    copy.set(preferenceType, new Set(users));
  }
  return copy;
};

export const convertPreferenceValuesToJSON = (
  preference: Map<PreferenceType, Set<string>>,
) => {
  const result = new Map<PreferenceType, string[]>();
  for (const [preferenceType, users] of preference) {
    result.set(preferenceType, Array.from(users));
  }
  return Object.fromEntries(result);
};
