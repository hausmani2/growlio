import { useContext } from 'react';
import { TabContext } from './context/TabContext';

export const useTabHook = () => {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabHook must be used within a TabProvider');
    }
    return context;
}; 