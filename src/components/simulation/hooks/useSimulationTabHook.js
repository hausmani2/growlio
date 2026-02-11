import { useContext } from 'react';
import { SimulationTabContext } from '../context/SimulationTabContext';

export const useSimulationTabHook = () => {
    const context = useContext(SimulationTabContext);
    if (!context) {
        throw new Error('useSimulationTabHook must be used within a SimulationTabProvider');
    }
    return context;
};
