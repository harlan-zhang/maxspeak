'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import {
  EMPTY_VOICE_CATALOG,
  VOICE_CATALOG_CHANGED,
  getVoiceStorageKey,
  isSameVoiceAccount,
  readVoiceCatalog,
  type VoiceAccount,
  type VoiceCatalog,
} from './custom-voices';

const emptyResult = { catalog: EMPTY_VOICE_CATALOG, storageError: null };

export function useVoiceCatalog() {
  const apiKey = useSettingsStore((state) => state.apiKey);
  const baseUrl = useSettingsStore((state) => state.baseUrl);
  const [snapshot, setSnapshot] = useState<{
    account: VoiceAccount;
    catalog: VoiceCatalog;
    storageError: string | null;
  } | null>(null);

  useEffect(() => {
    if (!apiKey.trim()) return;

    const account = { apiKey, baseUrl };
    let key: string;
    let active = true;

    function reportError(error: unknown) {
      if (!active) return;
      const reason = error instanceof Error ? error.message : '未知错误';
      setSnapshot({ account, catalog: EMPTY_VOICE_CATALOG, storageError: `无法读取音色库：${reason}` });
    }

    function refresh() {
      try {
        setSnapshot({ account, catalog: readVoiceCatalog(key), storageError: null });
      } catch (error) {
        reportError(error);
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.storageArea === window.localStorage && (event.key === key || event.key === null)) refresh();
    }

    getVoiceStorageKey(account).then((storageKey) => {
      if (!active) return;
      key = storageKey;
      window.addEventListener('storage', onStorage);
      window.addEventListener(VOICE_CATALOG_CHANGED, refresh);
      refresh();
    }).catch(reportError);

    return () => {
      active = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(VOICE_CATALOG_CHANGED, refresh);
    };
  }, [apiKey, baseUrl]);

  return snapshot && isSameVoiceAccount(snapshot.account, { apiKey, baseUrl }) ? snapshot : emptyResult;
}
