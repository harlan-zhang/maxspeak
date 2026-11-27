'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { PLANNER_PROVIDERS, requestPlanner, type PlannerConnection, type PlannerProvider } from '@/lib/planner/transport';
import { usePlannerSettingsStore } from '@/lib/store/usePlannerSettingsStore';

type ConnectionTest = {
  connection: PlannerConnection;
  status: 'pending' | 'success' | 'error';
  message: string;
};

export function PlannerConnectionSettings({ showHeading = true }: { showHeading?: boolean } = {}) {
  const { connection, setProvider, setBaseUrl, setModel, setApiKey } = usePlannerSettingsStore();
  const [test, setTest] = useState<ConnectionTest | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const helpId = useId();
  const currentTest = test?.connection === connection ? test : null;
  const isCustom = connection.provider === 'custom';

  useEffect(() => {
    const abortTest = () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
    const unsubscribe = usePlannerSettingsStore.subscribe(abortTest);
    return () => {
      unsubscribe();
      abortTest();
    };
  }, []);

  async function testConnection() {
    const snapshot = usePlannerSettingsStore.getState().connection;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setTest({ connection: snapshot, status: 'pending', message: '正在测试 AI 连接…' });

    try {
      await requestPlanner(null, snapshot, controller.signal);
      if (!controller.signal.aborted && usePlannerSettingsStore.getState().connection === snapshot) {
        setTest({ connection: snapshot, status: 'success', message: 'AI 连接成功。' });
      }
    } catch (error) {
      if (!controller.signal.aborted && usePlannerSettingsStore.getState().connection === snapshot) {
        setTest({
          connection: snapshot,
          status: 'error',
          message: error instanceof Error ? error.message : 'AI 连接测试失败，请重试。',
        });
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  return (
    <section className="space-y-3">
      {showHeading && <h3 className="text-sm font-semibold">AI 连接配置</h3>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label block">服务商</span>
          <select
            value={connection.provider}
            onChange={(event) => setProvider(event.target.value as PlannerProvider)}
            className="input-field"
          >
            {Object.entries(PLANNER_PROVIDERS).map(([provider, { label }]) => (
              <option key={provider} value={provider}>{label}</option>
            ))}
            <option value="custom">自定义（OpenAI 兼容）</option>
          </select>
        </label>
        <label className="block">
          <span className="label block">AI 模型</span>
          <input
            value={connection.model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="输入模型 ID"
            className="input-field font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {isCustom && (
          <label className="block sm:col-span-2">
            <span className="label block">API 地址（Base URL）</span>
            <input
              type="url"
              value={connection.baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.example.com/v1"
              className="input-field font-mono"
              aria-describedby={helpId}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="label block">AI API Key</span>
          <input
            type="password"
            value={connection.apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={isCustom ? '本机和局域网服务可留空' : undefined}
            className="input-field font-mono"
            aria-describedby={helpId}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>
      <p id={helpId} className="text-xs text-[rgb(var(--muted-foreground))]">
        AI 连接配置仅保存在当前标签页。更改服务商或 API 地址后，请重新输入 AI API Key。
        {isCustom && ' 浏览器会直连此地址，需允许当前工作台的来源。'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={testConnection}
          disabled={currentTest?.status === 'pending'}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          测试连接
        </button>
        {currentTest && (
          <p
            role={currentTest.status === 'error' ? 'alert' : 'status'}
            className={currentTest.status === 'error' ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-[rgb(var(--muted-foreground))]'}
          >
            {currentTest.message}
          </p>
        )}
      </div>
    </section>
  );
}
