// src/i18n/useTranslation.ts
import { create } from 'zustand';
import {
  detectInitialLanguage,
  formatChipBadge,
  formatColorName,
  formatErrorMessage,
  formatGameLogEntry,
  formatPlayerDisplayName,
  formatRoundPhaseTitle,
  LANGUAGE_STORAGE_KEY,
  translate,
  type Language,
  type TranslationKey,
} from './translations';
import type {
  CarrierColor,
  ChipColor,
  GameLogEntry,
  RoundPhase,
} from '../types/game';

interface I18nStoreState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nStoreState>((set) => ({
  language: detectInitialLanguage(),
  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch {
        // localStorage 접근 불가 시 무시
      }
      document.documentElement.lang = lang;
    }
    set({ language: lang });
  },
}));

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  const t = (
    key: TranslationKey,
    params?: Record<string, string | number>
  ): string => translate(language, key, params);

  const tColor = (color: ChipColor | CarrierColor): string =>
    formatColorName(language, color);

  const tChipBadge = (color: ChipColor): string =>
    formatChipBadge(language, color);

  const tPlayerName = (player: {
    id: string;
    name: string;
    isBot?: boolean;
  }): string => formatPlayerDisplayName(language, player);

  const tLog = (log: GameLogEntry): string =>
    formatGameLogEntry(language, log);

  const tError = (rawError: string | null): string | null =>
    formatErrorMessage(language, rawError);

  const tPhaseTitle = (
    roundPhase: RoundPhase,
    isPassedTurnOrder: boolean
  ): string => formatRoundPhaseTitle(language, roundPhase, isPassedTurnOrder);

  return {
    language,
    setLanguage,
    t,
    tColor,
    tChipBadge,
    tPlayerName,
    tLog,
    tError,
    tPhaseTitle,
  };
}
