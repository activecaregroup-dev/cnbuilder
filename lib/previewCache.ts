import { FormSection } from '@/types/form';

// Preview snapshots let unsaved builder work survive the trip to /preview and back.
// They live in sessionStorage (this browser tab only) and are cleared when the user
// returns to the form lists, so they can never mask changes other users have saved.
const PREVIEW_STORAGE_KEY = 'cnbuilder_preview';

export interface PreviewSnapshot {
  formName: string;
  sections: FormSection[];
  formSettings: { replannable: boolean; confirmable: boolean; isComplete: boolean };
  tabName: string;
  currentFormId: string | null;
  // updated_at of the saved form this snapshot was based on, used to detect other users' saves
  baseUpdatedAt: string | null;
}

export function savePreviewSnapshot(snapshot: PreviewSnapshot) {
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.error('Failed to store preview snapshot', err);
  }
}

export function readPreviewSnapshot(): PreviewSnapshot | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to read preview snapshot', err);
    return null;
  }
}

export function clearPreviewSnapshot() {
  try {
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    // Older versions kept the snapshot in localStorage, where it went stale - remove any leftovers
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear preview snapshot', err);
  }
}
