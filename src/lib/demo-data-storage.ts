const STORAGE_KEY = "finance-dashboard-demo-data";

export type DemoDataStore = {
  movements: any[];
  goals: any[];
  emergencySavings: any[];
  creditCards: any[];
};

const defaultStore: DemoDataStore = {
  movements: [],
  goals: [],
  emergencySavings: [],
  creditCards: [],
};

export function getDemoDataStore(): DemoDataStore {
  if (typeof window === "undefined") {
    return defaultStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultStore;
    }

    const parsed = JSON.parse(raw);
    return {
      movements: Array.isArray(parsed?.movements) ? parsed.movements : [],
      goals: Array.isArray(parsed?.goals) ? parsed.goals : [],
      emergencySavings: Array.isArray(parsed?.emergencySavings) ? parsed.emergencySavings : [],
      creditCards: Array.isArray(parsed?.creditCards) ? parsed.creditCards : [],
    };
  } catch {
    return defaultStore;
  }
}

export function saveDemoDataStore(store: DemoDataStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearDemoDataStore() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
