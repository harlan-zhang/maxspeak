import { create } from 'zustand';
import { PLANNER_PROVIDERS, type PlannerConnection, type PlannerProvider } from '@/lib/planner/transport';

interface PlannerSettingsState {
  connection: PlannerConnection;
  setProvider: (provider: PlannerProvider) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setApiKey: (apiKey: string) => void;
}

function defaultConnection(provider: PlannerProvider): PlannerConnection {
  return {
    provider,
    baseUrl: '',
    model: provider === 'custom' ? '' : PLANNER_PROVIDERS[provider].model,
    apiKey: '',
  };
}

// Both settings surfaces share this connection for the lifetime of the tab.
export const usePlannerSettingsStore = create<PlannerSettingsState>((set) => ({
  connection: defaultConnection('minimax'),
  setProvider: (provider) => set((state) =>
    state.connection.provider === provider ? state : { connection: defaultConnection(provider) }
  ),
  setBaseUrl: (baseUrl) => set((state) =>
    state.connection.baseUrl === baseUrl ? state : {
      connection: { ...state.connection, baseUrl, apiKey: '' },
    }
  ),
  setModel: (model) => set((state) =>
    state.connection.model === model ? state : { connection: { ...state.connection, model } }
  ),
  setApiKey: (apiKey) => set((state) =>
    state.connection.apiKey === apiKey ? state : { connection: { ...state.connection, apiKey } }
  ),
}));
