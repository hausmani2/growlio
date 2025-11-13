// import { Input, Select } from 'antd';
// import { useState, useEffect } from 'react';
// import PrimaryButton from '../../../../buttons/Buttons';
// import useTooltips from '../../../../../utils/useTooltips';
// import TooltipIcon from '../../../../common/TooltipIcon';


// const ThirdPartyProviders = ({ data, updateData, errors = {} }) => {
//     const tooltips = useTooltips('onboarding-food');

// //     // State to manage multiple providers
// //     const [providers, setProviders] = useState([
// //         { id: 1, providerName: '', providerFee: '' }
// //     ]);

// //     // State to manage if location uses hired party delivery - default to 'false' if not provided
// //     const [useHiredPartyDelivery, setUseHiredPartyDelivery] = useState(
// //         data.useHiredPartyDelivery !== undefined ? data.useHiredPartyDelivery : 'false'
// //     );

// //     console.log('🔍 Debug - ThirdPartyProviders - useHiredPartyDelivery state:', useHiredPartyDelivery);

// //     // Create percentage options from 1 to 50
// //     const percentageOptions = Array.from({ length: 50 }, (_, index) => {
// //         const percentage = index + 1;
// //         return {
// //             value: percentage.toString(),
// //             label: `${percentage}%`
// //         };
// //     });

// //     // Yes/No options for hired party delivery
// //     const yesNoOptions = [
// //         { value: 'true', label: 'Yes' },
// //         { value: 'false', label: 'No' }
// //     ];

// //     // Provider name options
// //     const providerOptions = [
// //         { value: 'Door Dash', label: 'Door Dash' },
// //         { value: 'Skip The Dishes', label: 'Skip The Dishes' }, 
// //         { value: 'Grubhub', label: 'Grubhub' }, 
// //         { value: 'Uber Eats', label: 'Uber Eats' },
// //         { value: 'Other', label: 'Other' }
// //     ];

// //     // Initialize providers from data if it exists
// //     useEffect(() => {
// //         if (data.providers && data.providers.length > 0) {
// //             setProviders(data.providers);
// //         }
// //     }, [data.providers]);

// //     // Initialize useHiredPartyDelivery when data changes
// //     useEffect(() => {
// //         if (data.useHiredPartyDelivery !== undefined) {
// //             setUseHiredPartyDelivery(data.useHiredPartyDelivery);
// //         }
// //     }, [data.useHiredPartyDelivery]);

// //     // Handle hired party delivery change
// //     const handleHiredPartyDeliveryChange = (value) => {
// //         console.log('🔍 Debug - ThirdPartyProviders - handleHiredPartyDeliveryChange called with value:', value);
// //         setUseHiredPartyDelivery(value);
// //         updateData('useHiredPartyDelivery', value);
        
// //         // If "No" is selected, clear providers data
// //         if (value === 'false') {
// //             setProviders([{ id: 1, providerName: '', providerFee: '' }]);
// //             updateData('providers', []);
// //         }
// //     };

// //     // Add a new provider
// //     const addProvider = () => {
// //         const newProvider = {
// //             id: Date.now(),
// //             providerName: '',
// //             providerFee: ''
// //         };
// //         const updatedProviders = [...providers, newProvider];
// //         setProviders(updatedProviders);
// //         updateData('providers', updatedProviders);
// //     };

// //     // Delete a provider
// //     const deleteProvider = (providerId) => {
// //         // Don't allow deleting if there's only one provider
// //         if (providers.length <= 1) {
// //             return;
// //         }
        
// //         const updatedProviders = providers.filter(provider => provider.id !== providerId);
// //         setProviders(updatedProviders);
// //         updateData('providers', updatedProviders);
// //     };

// //     // Update a specific provider
// //     const updateProvider = (providerId, field, value) => {
// //         const updatedProviders = providers.map(provider =>
// //             provider.id === providerId
// //                 ? { ...provider, [field]: value }
// //                 : provider
// //         );
// //         setProviders(updatedProviders);
// //         updateData('providers', updatedProviders);
// //     };

//     return (
//         <div className="bg-white rounded-xl border border-gray-200 p-6">
//             {/* Header Section */}
//             <div className="mb-6">
//                 <h3 className="text-xl font-bold text-orange-600 mb-2">Third-Party Providers</h3>
//                 <p className="text-gray-600 text-sm">
//                     Does this Location use hired party delivery?
//                     <TooltipIcon tooltipText={tooltips.hired_party_delivery} />
//                 </p>
//             </div>
            
//             {/* Form Fields */}
//             <div className="space-y-6">
//                 {/* Hired Party Delivery Question */}
//                 <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Does this Location use third party delivery?
//                         <TooltipIcon tooltipText={tooltips.third_party_delivery} />
//                         <span className="text-red-500">*</span>
//                     </label>
//                     <Select
//                         placeholder="Select Yes or No"
//                         className={`w-full h-11 rounded-lg text-sm ${
//                             errors.useHiredPartyDelivery ? 'border-red-500' : ''
//                         }`}
//                         value={useHiredPartyDelivery || undefined}
//                         onChange={handleHiredPartyDeliveryChange}
//                         options={yesNoOptions}
//                         status={errors.useHiredPartyDelivery ? 'error' : ''}
//                     />
//                     {errors.useHiredPartyDelivery && (
//                         <span className="text-red-500 text-xs mt-1">{errors.useHiredPartyDelivery}</span>
//                     )}
//                 </div>

// //                  Provider Details - Only show if "Yes" is selected 
// //                 {useHiredPartyDelivery === 'true' && (
// //                     <div className="space-y-4">
// //                         {providers.map((provider, index) => (
// //                             <div key={provider.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
// //                                 <div className="flex justify-between items-center mb-4">
// //                                     <h5 className="text-base font-semibold text-gray-700">
// //                                         Provider {index + 1}
// //                                     </h5>
// //                                     {providers.length > 1 && (
// //                                         <button
// //                                             type="button"
// //                                             onClick={() => deleteProvider(provider.id)}
// //                                             className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
// //                                         >
// //                                             Delete
// //                                         </button>
// //                                     )}
// //                                 </div>
                                
// //                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //                                     <div>
// //                                         <label htmlFor={`providerName-${provider.id}`} className="block text-sm font-semibold text-gray-700 mb-2">
// //                                             Provider Name
// //                                             <span className="text-red-500">*</span>
// //                                         </label>
// //                                         <Select
// //                                             id={`providerName-${provider.id}`}
// //                                             placeholder="Select Provider Name"
// //                                             className={`w-full h-11 rounded-lg text-sm ${
// //                                                 errors[`provider_${index}_name`] ? 'border-red-500' : ''
// //                                             }`}
// //                                             value={provider.providerName || undefined}
// //                                             onChange={(value) => updateProvider(provider.id, 'providerName', value)}
// //                                             options={providerOptions}
// //                                             status={errors[`provider_${index}_name`] ? 'error' : ''}
// //                                         />
// //                                         {errors[`provider_${index}_name`] && (
// //                                             <span className="text-red-500 text-xs mt-1">{errors[`provider_${index}_name`]}</span>
// //                                         )}
// //                                     </div>

// //                                     <div>
// //                                         <label htmlFor={`providerFee-${provider.id}`} className="block text-sm font-semibold text-gray-700 mb-2">
// //                                             Provider Fee
// //                                             <span className="text-red-500">*</span>
// //                                         </label>
// //                                         <Select
// //                                             id={`providerFee-${provider.id}`}
// //                                             placeholder="Select percentage"
// //                                             className={`w-full h-11 rounded-lg text-sm ${
// //                                                 errors[`provider_${index}_fee`] ? 'border-red-500' : ''
// //                                             }`}
// //                                             value={provider.providerFee || undefined}
// //                                             onChange={(value) => updateProvider(provider.id, 'providerFee', value)}
// //                                             options={percentageOptions}
// //                                             status={errors[`provider_${index}_fee`] ? 'error' : ''}
// //                                         />
// //                                         {errors[`provider_${index}_fee`] && (
// //                                             <span className="text-red-500 text-xs mt-1">{errors[`provider_${index}_fee`]}</span>
// //                                         )}
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                         ))}

// //                         <div className="flex justify-start">
// //                             <PrimaryButton
// //                                 title="Add Another Provider"
// //                                 className="bg-gray-200 text-black h-11 rounded-lg text-sm font-semibold w-full sm:w-auto"
// //                                 onClick={addProvider}
// //                             />
// //                         </div>
// //                     </div>
// //                 )}
// //             </div>
// //         </div>
// //     )
// // }

// // export default ThirdPartyProviders;