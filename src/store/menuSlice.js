import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEY } from '../Routes/App/Data';

const loadSettingsFromStorage = () => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return null;
};

const initialState = {
  isMenuOpen: false,
  componentDisplay: "chat",
  settings: loadSettingsFromStorage() || {
    ttsEnabled: true,
    selectedVoice: '',
    inactivityTimerEnabled: true,
    filterSpecialCharacters: true,
    showPromptPreface: false,
    newLineOnEnter: true
  }
};

export const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuOpen: (state, action) => {
      state.isMenuOpen = action.payload;
    },
    setComponentDisplay: (state, action) => {
      state.componentDisplay = action.payload;
    },
    updateSetting: (state, action) => {
      const { name, value } = action.payload;
      state.settings[name] = value;
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    },
    loadSettings: (state) => {
      const settings = loadSettingsFromStorage();
      if (settings) {
        state.settings = settings;
      }
    }
  }
});

export const { setMenuOpen, setComponentDisplay, updateSetting, loadSettings } = menuSlice.actions;

export default menuSlice.reducer;
