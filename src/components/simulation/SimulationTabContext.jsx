import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import BasicInformationStep from '../onBoarding/simulationSteps/BasicInformationStep';
import SalesChannelsAndOperatingDaysStep from '../onBoarding/simulationSteps/SalesChannelsAndOperatingDaysStep';
import LaborInformationStep from '../onBoarding/simulationSteps/LaborInformationStep';
import ExpensesStep from '../onBoarding/simulationSteps/ExpensesStep';
import { SimulationTabContext } from './context/SimulationTabContext';
import useStore from '../../store/store';
import LoadingSpinner from '../layout/LoadingSpinner';

export const SimulationTabProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState({
        basicinformation: {
            restaurantName: '',
            restaurantType: '',
            menuType: '',
            isFranchise: true,
            locationAddress: {
                city: '',
                state: '',
                fullAddress: '',
                address2: '',
                zipCode: '',
                sqft: ''
            }
        },
        saleschannels: {
            usesThirdPartyDelivery: false,
            thirdPartyProviders: [],
            thirdPartyInfo: {}
        },
        restaurant_operating_days: [],
        laborinformation: {
            avgHourlyRate: 0
        },
        expenses: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState(null);

    const {
        getSimulationOnboardingData,
        simulationOnboardingData,
        simulationOnboardingDataLoading,
        submitSimulationOnboarding,
        simulationOnboardingLoading
    } = useStore();

    const tabs = [
        { id: 0, title: 'Basic Information', path: 'basic-information', required: true },
        { id: 1, title: 'Sales Channels & Operating Days', path: 'sales-channels-operating-days', required: true },
        { id: 2, title: 'Labor Information', path: 'labor-information', required: true },
        { id: 3, title: 'Expenses', path: 'expenses', required: true },
    ];

    // Map URL paths to tab IDs
    const pathToTabId = {
        'basic-information': 0,
        'sales-channels-operating-days': 1,
        'labor-information': 2,
        'expenses': 3,
    };

    // Load existing simulation onboarding data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Get restaurant ID from localStorage
                const simRestaurantId = localStorage.getItem('simulation_restaurant_id');
                if (simRestaurantId) {
                    setRestaurantId(simRestaurantId);
                }

                // Load onboarding data
                const result = await getSimulationOnboardingData(true);
                
                if (result.success && result.data) {
                    // Parse and populate form data from API response
                    const apiData = result.data;
                    
                    // Handle nested array format: [[{step: "...", data: {...}}, ...]]
                    let stepsData = [];
                    if (Array.isArray(apiData)) {
                        // If it's a nested array, flatten it
                        if (apiData.length > 0 && Array.isArray(apiData[0])) {
                            stepsData = apiData[0];
                        } else {
                            stepsData = apiData;
                        }
                    } else if (apiData && typeof apiData === 'object') {
                        // Convert object to array format
                        stepsData = Object.entries(apiData)
                            .filter(([key]) => key !== 'restaurant_id' && key !== 'simulation_restaurant_id')
                            .map(([step, data]) => ({
                                step,
                                status: data?.status,
                                data: data?.data
                            }));
                    }

                    // Extract restaurant_id from Basic Information step's location data
                    let extractedRestaurantId = null;
                    const basicInfoStep = stepsData.find(s => s.step === 'Basic Information');
                    if (basicInfoStep?.data) {
                        // Check locations array first
                        if (basicInfoStep.data.locations?.[0]?.restaurant_id) {
                            extractedRestaurantId = basicInfoStep.data.locations[0].restaurant_id;
                        } 
                        // Check restaurant object
                        else if (basicInfoStep.data.restaurant?.restaurant_id) {
                            extractedRestaurantId = basicInfoStep.data.restaurant.restaurant_id;
                        }
                        // Check if restaurant_id is directly in data
                        else if (basicInfoStep.data.restaurant_id) {
                            extractedRestaurantId = basicInfoStep.data.restaurant_id;
                        }
                    }
                    
                    if (extractedRestaurantId) {
                        setRestaurantId(extractedRestaurantId.toString());
                        localStorage.setItem('simulation_restaurant_id', extractedRestaurantId.toString());
                    } else {
                        // Fallback: try to get from localStorage if already set
                        const storedId = localStorage.getItem('simulation_restaurant_id');
                        if (storedId) {
                            setRestaurantId(storedId);
                        }
                    }

                    // Populate form data from API response
                    stepsData.forEach(stepInfo => {
                        const { step: stepName, data: stepData } = stepInfo;
                        
                        if (stepName === 'Basic Information' && stepData) {
                            // Handle the structure: data.restaurant.name and data.locations[0]
                            const restaurant = stepData.restaurant || {};
                            const location = stepData.locations?.[0] || {};
                            
                            setFormData(prev => ({
                                ...prev,
                                basicinformation: {
                                    restaurantName: restaurant.name || location.name || '',
                                    restaurantType: restaurant.restaurant_type || '',
                                    menuType: restaurant.menu_type || '',
                                    isFranchise: location.is_franchise !== undefined 
                                        ? location.is_franchise 
                                        : true,
                                    locationAddress: {
                                        city: location.city || '',
                                        state: location.state || '',
                                        fullAddress: location.address_1 || '',
                                        address2: location.address_2 || '',
                                        zipCode: location.zip_code || '',
                                        sqft: location.sqft?.toString() || '',
                                        latitude: location.latitude || null,
                                        longitude: location.longitude || null
                                    }
                                }
                            }));
                        } else if (stepName === 'Sales Channels' && stepData) {
                            // Handle Sales Channels - check for delivery_days (operating days) and third_party_info
                            // Note: delivery_days in API response is actually the operating days
                            const operatingDays = stepData.restaurant_operating_days || 
                                                stepData.delivery_days || 
                                                stepData.operatingdays || 
                                                [];
                            
                            setFormData(prev => ({
                                ...prev,
                                saleschannels: {
                                    usesThirdPartyDelivery: stepData.uses_third_party_delivery || false,
                                    thirdPartyProviders: stepData.third_party_providers || [],
                                    thirdPartyInfo: stepData.third_party_info || {}
                                },
                                restaurant_operating_days: Array.isArray(operatingDays) ? operatingDays : []
                            }));
                        } else if (stepName === 'Labour Information' && stepData) {
                            setFormData(prev => ({
                                ...prev,
                                laborinformation: {
                                    avgHourlyRate: parseFloat(stepData.avg_hourly_rate) || 0
                                }
                            }));
                        } else if (stepName === 'Expenses' && stepData) {
                            // Convert API expense format to component format
                            const expenses = Array.isArray(stepData) ? stepData : [];
                            setFormData(prev => ({
                                ...prev,
                                expenses: expenses.map(exp => {
                                    // Handle both "monthly"/"weekly" (lowercase) and "MONTHLY"/"WEEKLY" (uppercase) formats
                                    let expenseType = 'MONTHLY';
                                    if (exp.fixed_expense_type) {
                                        expenseType = exp.fixed_expense_type.toUpperCase() === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY';
                                    } else if (exp.expense_type) {
                                        expenseType = exp.expense_type.toLowerCase() === 'monthly' ? 'MONTHLY' : 'WEEKLY';
                                    }
                                    
                                    return {
                                        category: exp.category || '',
                                        name: exp.name || '',
                                        amount: parseFloat(exp.amount) || 0,
                                        is_value_type: exp.is_value_type !== undefined ? exp.is_value_type : true,
                                        fixed_expense_type: expenseType,
                                        is_active: exp.is_active !== undefined ? exp.is_active : true
                                    };
                                })
                            }));
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading simulation onboarding data:', error);
                message.error('Failed to load simulation data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [getSimulationOnboardingData]);

    // Sync active tab with URL
    useEffect(() => {
        const path = location.pathname.split('/').pop();
        const tabId = pathToTabId[path];
        if (tabId !== undefined) {
            setActiveTab(tabId);
        }
    }, [location.pathname]);

    // Check if a step is completed (based on form data)
    const isStepCompleted = (stepName) => {
        switch (stepName) {
            case 'Basic Information':
                return !!(formData.basicinformation?.restaurantName && 
                         formData.basicinformation?.locationAddress?.city);
            case 'Sales Channels & Operating Days':
                return !!(formData.restaurant_operating_days?.length > 0);
            case 'Labor Information':
                return !!(formData.laborinformation?.avgHourlyRate > 0);
            case 'Expenses':
                return !!(formData.expenses?.length > 0);
            default:
                return false;
        }
    };

    // Check if user can navigate to a specific tab
    const canNavigateToTab = (targetTabId, showMessage = true) => {
        // In update mode, always allow navigation to any tab
        return true;
    };

    // Get step completion status for UI
    const getStepStatus = (tabId) => {
        const tab = tabs[tabId];
        if (!tab) return { completed: false, accessible: false };

        const completed = isStepCompleted(tab.title);
        const accessible = canNavigateToTab(tabId, false);

        return { completed, accessible };
    };

    // Handle tab click
    const handleTabClick = async (tabId) => {
        if (canNavigateToTab(tabId)) {
            // Save current step data before switching tabs
            await saveCurrentStepData();
            
            const tab = tabs[tabId];
            navigate(`/simulation/${tab.path}`);
            setActiveTab(tabId);
        }
    };

    // Update form data
    const updateFormData = (stepKey, data) => {
        setFormData(prev => {
            if (stepKey === 'expenses') {
                const expensesData = Array.isArray(data) ? data : (data?.expenses || []);
                return {
                    ...prev,
                    [stepKey]: expensesData
                };
            }
            
            if (stepKey === 'restaurant_operating_days') {
                const daysData = Array.isArray(data) ? data : [];
                return {
                    ...prev,
                    restaurant_operating_days: daysData
                };
            }
            
            if (data && typeof data === 'object' && (data.saleschannels || data.restaurant_operating_days)) {
                return {
                    ...prev,
                    saleschannels: data.saleschannels || prev.saleschannels,
                    restaurant_operating_days: Array.isArray(data.restaurant_operating_days) 
                        ? data.restaurant_operating_days 
                        : prev.restaurant_operating_days
                };
            }
            
            return {
                ...prev,
                [stepKey]: { ...prev[stepKey], ...data }
            };
        });
    };

    // Save current step data
    const saveCurrentStepData = async () => {
        try {
            // Format expenses
            let expenses = formData.expenses;
            if (!Array.isArray(expenses)) {
                expenses = [];
            }
            
            const expensesData = expenses
                .filter(exp => exp && typeof exp === 'object' && exp.is_active)
                .map(exp => ({
                    category: exp.category || '',
                    name: exp.name || '',
                    orignal_amount: parseFloat(exp.amount) || 0,
                    is_value_type: exp.is_value_type === true,
                    amount: parseFloat(exp.amount) || 0,
                    expense_type: exp.fixed_expense_type === 'MONTHLY' ? 'monthly' : 'weekly'
                }));

            const payload = {
                restaurant_id: restaurantId || null,
                "Basic Information": {
                    status: true,
                    data: {
                        name: formData.basicinformation?.restaurantName || '',
                        restaurant_type: formData.basicinformation?.restaurantType || '',
                        menu_type: formData.basicinformation?.menuType || '',
                        number_of_locations: 1,
                        locations: [{
                            name: formData.basicinformation?.restaurantName || '',
                            address_1: formData.basicinformation?.locationAddress?.fullAddress || '',
                            address_2: formData.basicinformation?.locationAddress?.address2 || '',
                            country: 'USA',
                            city: formData.basicinformation?.locationAddress?.city || '',
                            state: formData.basicinformation?.locationAddress?.state || '',
                            zip_code: formData.basicinformation?.locationAddress?.zipCode || '',
                            sqft: formData.basicinformation?.locationAddress?.sqft || '',
                            is_franchise: formData.basicinformation?.isFranchise || false,
                            ...(formData.basicinformation?.locationAddress?.latitude !== null && 
                                formData.basicinformation?.locationAddress?.latitude !== undefined && 
                                !isNaN(parseFloat(formData.basicinformation?.locationAddress?.latitude)) && {
                                latitude: parseFloat(formData.basicinformation?.locationAddress?.latitude)
                            }),
                            ...(formData.basicinformation?.locationAddress?.longitude !== null && 
                                formData.basicinformation?.locationAddress?.longitude !== undefined && 
                                !isNaN(parseFloat(formData.basicinformation?.locationAddress?.longitude)) && {
                                longitude: parseFloat(formData.basicinformation?.locationAddress?.longitude)
                            })
                        }]
                    }
                },
                "Sales Channels": {
                    status: true,
                    data: {
                        uses_third_party_delivery: formData.saleschannels?.usesThirdPartyDelivery || false,
                        third_party_info: formData.saleschannels?.thirdPartyInfo || {},
                        restaurant_operating_days: Array.isArray(formData.restaurant_operating_days) 
                            ? formData.restaurant_operating_days 
                            : []
                    }
                },
                "Labour Information": {
                    status: true,
                    data: {
                        avg_hourly_rate: formData.laborinformation?.avgHourlyRate || 0
                    }
                },
                "Expenses": {
                    status: true,
                    data: expensesData
                }
            };

            const result = await submitSimulationOnboarding(payload);
            
            if (result.success) {
                message.success('Data saved successfully!');
                // Refresh data
                await getSimulationOnboardingData(true);
                return true;
            } else {
                message.error(result.error || 'Failed to save data');
                return false;
            }
        } catch (error) {
            console.error('Error saving step data:', error);
            message.error('Failed to save data');
            return false;
        }
    };

    // Render active content based on tab
    const renderActiveContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <div>
                        <BasicInformationStep
                            data={formData.basicinformation}
                            updateData={(data) => updateFormData('basicinformation', data)}
                            onNext={async () => {
                                await saveCurrentStepData();
                                handleTabClick(1);
                            }}
                            onBack={() => {}}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={async () => {
                                    const saved = await saveCurrentStepData();
                                    if (saved) {
                                        message.success('Basic Information saved successfully!');
                                    }
                                }}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <SalesChannelsAndOperatingDaysStep
                            data={{
                                saleschannels: formData.saleschannels,
                                restaurant_operating_days: formData.restaurant_operating_days
                            }}
                            updateData={(data) => updateFormData('sales-channels-operating-days', data)}
                            onNext={async () => {
                                await saveCurrentStepData();
                                handleTabClick(2);
                            }}
                            onBack={() => handleTabClick(0)}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={async () => {
                                    const saved = await saveCurrentStepData();
                                    if (saved) {
                                        message.success('Sales Channels & Operating Days saved successfully!');
                                    }
                                }}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <LaborInformationStep
                            data={formData.laborinformation}
                            updateData={(data) => updateFormData('laborinformation', data)}
                            onNext={async () => {
                                await saveCurrentStepData();
                                handleTabClick(3);
                            }}
                            onBack={() => handleTabClick(1)}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={async () => {
                                    const saved = await saveCurrentStepData();
                                    if (saved) {
                                        message.success('Labor Information saved successfully!');
                                    }
                                }}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <ExpensesStep
                            data={formData.expenses}
                            updateData={(data) => updateFormData('expenses', data)}
                            onNext={() => {}}
                            onBack={() => handleTabClick(2)}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={async () => {
                                    const saved = await saveCurrentStepData();
                                    if (saved) {
                                        message.success('Expenses saved successfully!');
                                    }
                                }}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                );
            default:
                return (
                    <BasicInformationStep
                        data={formData.basicinformation}
                        updateData={(data) => updateFormData('basicinformation', data)}
                        onNext={() => handleTabClick(1)}
                        onBack={() => {}}
                    />
                );
        }
    };

    const value = {
        activeTab,
        tabs,
        handleTabClick,
        renderActiveContent,
        canNavigateToTab,
        getStepStatus,
        isStepCompleted,
        formData,
        updateFormData,
        saveCurrentStepData,
        isLoading: isLoading || simulationOnboardingDataLoading || simulationOnboardingLoading,
        restaurantId
    };

    if (isLoading || simulationOnboardingDataLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner 
                    message="Loading simulation data..." 
                    size="medium" 
                    showSubtext={true}
                />
            </div>
        );
    }

    return (
        <SimulationTabContext.Provider value={value}>
            {children}
        </SimulationTabContext.Provider>
    );
};
