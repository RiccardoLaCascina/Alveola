/*
  Chiave API di Anthropic del pizzaiolo ("porta la tua chiave").
  Resta SOLO su questo dispositivo (localStorage): non passa da nessun server nostro.
  localStorage può non esserci (navigazione privata, memoria piena): ogni accesso è protetto.
*/

const STORAGE_KEY = "lievora-claude-api-key";

export function readApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** true se è stata salvata davvero. */
export function saveApiKey(key: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
    return true;
  } catch {
    return false;
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* niente da fare */
  }
}

/** Controllo leggero della forma: le chiavi di Anthropic iniziano con "sk-ant-". */
export function looksLikeApiKey(key: string): boolean {
  return /^sk-ant-[\w-]{20,}$/.test(key.trim());
}
