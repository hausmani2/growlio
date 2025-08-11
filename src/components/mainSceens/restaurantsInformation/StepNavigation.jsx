import React from 'react';
import { useTabHook } from './useTabHook';
import { CheckCircle, Circle, Lock } from 'lucide-react';

const StepNavigation = () => {
    const { tabs, activeTab, handleTabClick, getStepStatus } = useTabHook();

    const getStepIcon = (tabId) => {
        const { completed, accessible } = getStepStatus(tabId);
        
        if (completed) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        } else if (accessible) {
            return <Circle className="w-5 h-5 text-gray-400" />;
        } else {
            return <Lock className="w-5 h-5 text-gray-300" />;
        }
    };

    const getStepClassName = (tabId) => {
        const { completed, accessible } = getStepStatus(tabId);
        const isActive = activeTab === tabId;
        
        let baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer";
        
        if (isActive) {
            return `${baseClasses} bg-blue-50 border-2 border-blue-500 text-blue-700`;
        } else if (completed) {
            return `${baseClasses} bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100`;
        } else if (accessible) {
            return `${baseClasses} bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50`;
        } else {
            return `${baseClasses} bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed`;
        }
    };

    const handleStepClick = (tabId) => {
        const { accessible } = getStepStatus(tabId);
        if (accessible) {
            handleTabClick(tabId);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Onboarding Progress</h3>
            
            <div className="space-y-3">
                {tabs.map((tab, index) => (
                    <div key={tab.id} className="relative">
                        <div
                            className={getStepClassName(tab.id)}
                            onClick={() => handleStepClick(tab.id)}
                        >
                            <div className="flex-shrink-0">
                                {getStepIcon(tab.id)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{tab.title}</span>
                                    {tab.required && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                            Required
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {getStepStatus(tab.id).completed ? 'Completed' : 'Pending'}
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress line */}
                        {index < tabs.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Progress:</span>
                    <span>
                        {tabs.filter(tab => getStepStatus(tab.id).completed).length} of {tabs.length} steps completed
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StepNavigation; 