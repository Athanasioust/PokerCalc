import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OddsFormat = '%' | 'X:1';

interface SettingsContextValue {
  advancedMode: boolean;
  oddsFormat: OddsFormat;
  setAdvancedMode: (v: boolean) => void;
  setOddsFormat: (f: OddsFormat) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  advancedMode: true,
  oddsFormat: '%',
  setAdvancedMode: () => {},
  setOddsFormat: () => {},
});

const PREF_ADVANCED_MODE = 'pref_advanced_mode';
const PREF_ODDS_FORMAT = 'pref_odds_format';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [advancedMode, setAdvancedModeState] = useState(true);
  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>('%');

  useEffect(() => {
    AsyncStorage.multiGet([PREF_ADVANCED_MODE, PREF_ODDS_FORMAT]).then(pairs => {
      if (pairs[0][1] === 'false') setAdvancedModeState(false);
      if (pairs[1][1] === 'X:1') setOddsFormatState('X:1');
    });
  }, []);

  function setAdvancedMode(v: boolean) {
    setAdvancedModeState(v);
    AsyncStorage.setItem(PREF_ADVANCED_MODE, String(v));
  }

  function setOddsFormat(f: OddsFormat) {
    setOddsFormatState(f);
    AsyncStorage.setItem(PREF_ODDS_FORMAT, f);
  }

  return (
    <SettingsContext.Provider value={{ advancedMode, oddsFormat, setAdvancedMode, setOddsFormat }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
