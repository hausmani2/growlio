import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Input, Select, message, Table, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/store';
import { ONBOARDING_ROUTES } from '../../../utils/onboardingUtils';
import useRestaurantRole from '../../../hooks/useRestaurantRole';
import AddressInformation from '../restaurantsInformation/steps/basicInformation/AddressInformation';
import {
  buildLocationPayload,
  createEmptyLocationForm,
  getLocationDisplayName,
  mapApiLocationToAddress,
  mapApiLocationToTypeData,
} from '../../../utils/locationFormUtils';
import { getMaxLocationsCap } from '../../../utils/packageDisplay';

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const getPlanLocationCap = (plan) => {
  const planName = getPlanName(plan);
  if (planName.includes('lite')) return 1;
  if (planName.includes('grow')) return 5;
  if (planName.includes('pro')) return null;
  return getMaxLocationsCap(plan);
};

const LocationsTab = () => {
  const navigate = useNavigate();
  const {
    completeOnboardingData,
    loadExistingOnboardingData,
    submitStepData,
    onboardingLoading,
    fetchCurrentSubscriptionDetails,
    subscriptionDetails,
    currentPackage,
    fetchLocations,
    changeLocation,
    checkLocationOnboarding,
    setSelectedLocationId,
  } = useStore();
  const { isOwner, restaurantId } = useRestaurantRole();
  const [formErrors, setFormErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  const [numberOfLocations, setNumberOfLocations] = useState('1');
  const [existingLocations, setExistingLocations] = useState([]);
  const [newLocations, setNewLocations] = useState([]);
  const [restaurantMeta, setRestaurantMeta] = useState({
    restaurantName: '',
    restaurantType: '',
    menuType: '',
  });

  useEffect(() => {
    const load = async () => {
      await fetchCurrentSubscriptionDetails?.();
      await loadExistingOnboardingData(true);
    };
    load();
  }, []);

  useEffect(() => {
    const basic = completeOnboardingData?.['Basic Information']?.data;
    if (!basic) return;

    const locations = Array.isArray(basic.locations) ? basic.locations : [];
    setExistingLocations(locations);
    setRestaurantMeta({
      restaurantName: basic.restaurant_name || '',
      restaurantType: basic.restaurant_type || '',
      menuType: basic.menu_type || '',
    });
    setNumberOfLocations(String(Math.max(locations.length, basic.number_of_locations || locations.length || 1)));
  }, [completeOnboardingData]);

  const locationSelectModel = useMemo(() => {
    const pkg = subscriptionDetails?.package || currentPackage || null;
    const restaurant = subscriptionDetails?.restaurant || null;
    const allowedLocations =
      typeof restaurant?.allowed_locations === 'number' ? restaurant.allowed_locations : null;
    const planLocationCap = getPlanLocationCap(pkg);
    const maxFromPlan =
      planLocationCap === null
        ? null
        : typeof planLocationCap === 'number'
          ? planLocationCap
          : typeof pkg?.max_locations === 'number'
            ? pkg.max_locations
            : null;
    const actualCount =
      typeof restaurant?.actual_location_count === 'number'
        ? restaurant.actual_location_count
        : existingLocations.length;
    const remainingAddable =
      typeof restaurant?.remaining_addable_locations === 'number'
        ? restaurant.remaining_addable_locations
        : null;
    const computedMaxAddableTotal =
      actualCount !== null && remainingAddable !== null ? actualCount + remainingAddable : null;
    const hardCap = 100;
    const unlimitedPlan = planLocationCap === null;
    const planAwareCap = unlimitedPlan ? null : maxFromPlan;
    const allowedCap =
      allowedLocations !== null && planAwareCap !== null
        ? Math.min(allowedLocations, planAwareCap)
        : allowedLocations ?? planAwareCap;
    const maxDropdown = Math.max(1, Math.min(hardCap, allowedCap ?? computedMaxAddableTotal ?? 1));
    const maxSelectable = Math.max(1, Math.min(maxDropdown, allowedCap ?? computedMaxAddableTotal ?? maxDropdown));

    return {
      maxDropdown,
      maxSelectable,
      allowedLocations: allowedCap,
      actualCount,
      remainingAddable,
      pricePerLocation: typeof pkg?.price_per_location === 'number' ? pkg.price_per_location : null,
    };
  }, [currentPackage, subscriptionDetails, existingLocations.length]);

  const desiredCount = useMemo(() => {
    const n = Number(numberOfLocations || existingLocations.length || 1);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [numberOfLocations, existingLocations.length]);

  useEffect(() => {
    const neededNew = Math.max(0, desiredCount - existingLocations.length);
    setNewLocations((prev) => {
      const next = [...prev];
      if (next.length === neededNew) return next;
      if (next.length < neededNew) {
        for (let i = next.length; i < neededNew; i += 1) {
          next.push(createEmptyLocationForm());
        }
      } else {
        next.length = neededNew;
      }
      return next;
    });
  }, [desiredCount, existingLocations.length]);

  const numberOfLocationsOptions = useMemo(() => {
    const minCount = Math.max(1, existingLocations.length);
    const options = [];
    for (let i = minCount; i <= locationSelectModel.maxDropdown; i += 1) {
      options.push({
        value: String(i),
        label: String(i),
        disabled: i > locationSelectModel.maxSelectable,
      });
    }
    return options;
  }, [existingLocations.length, locationSelectModel.maxDropdown, locationSelectModel.maxSelectable]);

  const updateNewLocation = (index, field, value) => {
    setNewLocations((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[`new_${index}_locationName`];
      return next;
    });
  };

  const getNewLocationErrors = (formIndex) => ({
    locationName: formErrors[`new_${formIndex}_locationName`],
    address1: formErrors[`new_${formIndex}_address1`],
    country: formErrors[`new_${formIndex}_country`],
    city: formErrors[`new_${formIndex}_city`],
    state: formErrors[`new_${formIndex}_state`],
    zipCode: formErrors[`new_${formIndex}_zipCode`],
    sqft: formErrors[`new_${formIndex}_sqft`],
    isFranchise: formErrors[`new_${formIndex}_isFranchise`],
  });

  const handleSave = async () => {
    if (!restaurantId) {
      message.error('Restaurant not found');
      return;
    }

    const additionalErrors = {};
    newLocations.forEach((loc, idx) => {
      if (!loc.locationName?.trim()) additionalErrors[`new_${idx}_locationName`] = 'Location name is required';
      if (!loc.address1?.trim()) additionalErrors[`new_${idx}_address1`] = 'Address is required';
      if (!loc.country) additionalErrors[`new_${idx}_country`] = 'Country is required';
      if (!loc.state) additionalErrors[`new_${idx}_state`] = 'State is required';
      if (!loc.city) additionalErrors[`new_${idx}_city`] = 'City is required';
      if (!loc.zipCode?.trim()) additionalErrors[`new_${idx}_zipCode`] = 'Zip code is required';
      if (!loc.sqft?.trim()) additionalErrors[`new_${idx}_sqft`] = 'SQFT is required';
      if (!loc.isFranchise) additionalErrors[`new_${idx}_isFranchise`] = 'Franchise selection is required';
    });

    setFormErrors(additionalErrors);

    if (Object.keys(additionalErrors).length > 0) {
      message.error('Please fill in all required fields for new locations');
      return;
    }

    const existingPayload = existingLocations.map((loc) => {
      const typeData = mapApiLocationToTypeData(loc);
      return buildLocationPayload(
        getLocationDisplayName(loc),
        mapApiLocationToAddress(loc),
        typeData.sqft,
        typeData.isFranchise,
        loc.id
      );
    });

    const newPayload = newLocations.map((loc) =>
      buildLocationPayload(loc.locationName, loc, loc.sqft, loc.isFranchise)
    );

    const basic = completeOnboardingData?.['Basic Information']?.data || {};
    const restaurantName =
      restaurantMeta.restaurantName ||
      basic.restaurant_name ||
      subscriptionDetails?.restaurant?.name ||
      '';

    if (!restaurantName) {
      message.error('Restaurant name is missing. Please complete Restaurant Details first.');
      return;
    }

    const restaurantType = (restaurantMeta.restaurantType || basic.restaurant_type || '').trim();
    const menuType = (restaurantMeta.menuType || basic.menu_type || '').trim();

    const stepData = {
      restaurant_name: restaurantName,
      number_of_locations: desiredCount,
      locations: [...existingPayload, ...newPayload],
      restaurant_id: Number(restaurantId),
    };

    // Omit empty values — backend reuses existing DB fields when already set.
    if (restaurantType) stepData.restaurant_type = restaurantType;
    if (menuType) stepData.menu_type = menuType;

    const previousLocationIds = new Set(
      existingLocations.map((loc) => loc.id).filter(Boolean)
    );

    try {
      setSaveError(null);
      await submitStepData('Basic Information', stepData, async () => {
        message.success('Locations saved successfully');
        setSaveError(null);
        const updatedLocations = (await fetchLocations?.()) || [];
        const addedLocation =
          updatedLocations.find((loc) => loc?.id && !previousLocationIds.has(loc.id)) ||
          updatedLocations[updatedLocations.length - 1];

        if (addedLocation?.id) {
          if (typeof changeLocation === 'function') {
            changeLocation(addedLocation.id);
          } else {
            setSelectedLocationId?.(addedLocation.id);
          }

          if (typeof checkLocationOnboarding === 'function') {
            const result = await checkLocationOnboarding(
              addedLocation.id,
              window.location.pathname
            );
            if (result?.shouldRedirect && result?.nextRoute) {
              message.info('Complete setup for this new location');
              navigate(result.nextRoute, { replace: true });
              return;
            }
          } else {
            navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
            return;
          }
        }

        await loadExistingOnboardingData(true);
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save locations';
      setSaveError(errorMessage);
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: 'Location',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-800">{getLocationDisplayName(record)}</div>
          <div className="text-sm text-gray-500">
            {[record.address_1, record.city, record.state].filter(Boolean).join(', ')}
          </div>
        </div>
      ),
    },
    {
      title: 'SQFT',
      dataIndex: 'sqft',
      key: 'sqft',
    },
    {
      title: 'Franchise',
      key: 'franchise',
      render: (_, record) => (
        <Tag color={record.is_franchise ? 'blue' : 'default'}>
          {record.is_franchise ? 'Yes' : 'No'}
        </Tag>
      ),
    },
  ];

  if (!isOwner) {
    return (
      <Card className="shadow-sm border-0 bg-gray-50">
        <p className="text-sm text-amber-700 m-0">
          Only owners can add and manage restaurant locations.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {saveError && (
        <Alert
          type="error"
          message={saveError}
          showIcon
          closable
          onClose={() => setSaveError(null)}
        />
      )}

      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="pb-3 border-b border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-orange-600 mb-1">Locations</h3>
          <p className="text-sm text-gray-600 mb-0">
            Add new locations for your restaurant. Edit an existing location&apos;s details from
            Restaurant Details using the location dropdown in the header.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="numberOfLocationsSettings" className="block text-sm font-semibold text-gray-700 mb-2">
            Total locations (including existing)
          </label>
          <Select
            id="numberOfLocationsSettings"
            className="w-full max-w-xs h-11"
            value={numberOfLocations}
            onChange={setNumberOfLocations}
            options={numberOfLocationsOptions}
          />
          <div className="mt-2 text-xs text-gray-600">
            {locationSelectModel.allowedLocations !== null && (
              <span>
                Allowed: <strong>{locationSelectModel.allowedLocations}</strong>. Existing:{' '}
                <strong>{existingLocations.length}</strong>.
                {locationSelectModel.remainingAddable !== null && (
                  <>
                    {' '}
                    You can add <strong>{locationSelectModel.remainingAddable}</strong> more.
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <Table
          rowKey={(row) => row.id || getLocationDisplayName(row)}
          columns={columns}
          dataSource={existingLocations}
          pagination={false}
          className="mb-6"
        />

        {newLocations.map((loc, idx) => {
          const locationNumber = existingLocations.length + idx + 1;
          const locErrors = getNewLocationErrors(idx);
          return (
            <div key={`new-location-${locationNumber}`} className="space-y-4 mb-8">
              <Card className="border border-orange-100 bg-orange-50/30">
                <h4 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
                  <PlusOutlined />
                  New Location {locationNumber}
                </h4>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder={`Enter location ${locationNumber} name`}
                    className="h-11"
                    value={loc.locationName}
                    onChange={(e) => updateNewLocation(idx, 'locationName', e.target.value)}
                  />
                  {locErrors.locationName && (
                    <span className="text-red-500 text-xs">{locErrors.locationName}</span>
                  )}
                </div>

                <AddressInformation
                  data={loc}
                  updateData={(field, value) => updateNewLocation(idx, field, value)}
                  errors={locErrors}
                  title={`Address for Location ${locationNumber}`}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SQFT <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className="h-11"
                      value={loc.sqft}
                      onChange={(e) => updateNewLocation(idx, 'sqft', e.target.value)}
                    />
                    {locErrors.sqft && <span className="text-red-500 text-xs">{locErrors.sqft}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Franchise? <span className="text-red-500">*</span>
                    </label>
                    <Select
                      className="w-full h-11"
                      placeholder="Select"
                      value={loc.isFranchise || undefined}
                      onChange={(value) => updateNewLocation(idx, 'isFranchise', value)}
                      options={[
                        { value: '2', label: 'Yes' },
                        { value: '1', label: 'No' },
                      ]}
                    />
                    {locErrors.isFranchise && (
                      <span className="text-red-500 text-xs">{locErrors.isFranchise}</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        {newLocations.length > 0 && (
          <button
            type="button"
            onClick={handleSave}
            disabled={onboardingLoading}
            className={`bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold ${
              onboardingLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
            }`}
          >
            {onboardingLoading ? 'Saving...' : 'Save Locations'}
          </button>
        )}

        {newLocations.length === 0 && locationSelectModel.remainingAddable === 0 && (
          <p className="text-sm text-gray-600 m-0">
            You have reached your location limit. Upgrade your plan to add more locations.
          </p>
        )}
      </Card>
    </div>
  );
};

export default LocationsTab;
