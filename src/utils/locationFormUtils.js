export const mapApiLocationToAddress = (loc = {}) => ({
  address1: loc.address_1 || '',
  address2: loc.address_2 || '',
  country: loc.country === 'USA' ? '1' : loc.country === 'Canada' ? '2' : '',
  city: loc.city || '',
  state: loc.state || '',
  zipCode: loc.zip_code || '',
  latitude: loc.latitude ?? loc.lat ?? null,
  longitude: loc.longitude ?? loc.lng ?? null,
});

export const mapApiLocationToTypeData = (loc = {}) => ({
  sqft: loc.sqft?.toString() || '',
  isFranchise: loc.is_franchise ? '2' : '1',
});

export const getLocationDisplayName = (loc = {}) =>
  loc.location_name || loc.name || 'Unnamed location';

export const buildLocationPayload = (locationName, addressData, sqft, isFranchise, locationId = null) => {
  const locationObj = {
    location_name: locationName,
    address_1: addressData.address1,
    address_2: addressData.address2,
    city: addressData.city,
    country: addressData.country === '1' ? 'USA' : addressData.country === '2' ? 'Canada' : '',
    state: addressData.state,
    zip_code: addressData.zipCode,
    sqft: parseInt(sqft, 10) || 0,
    is_franchise: isFranchise === '2',
  };

  if (
    addressData.latitude !== null &&
    addressData.latitude !== undefined &&
    !Number.isNaN(parseFloat(addressData.latitude))
  ) {
    locationObj.latitude = parseFloat(addressData.latitude);
  }
  if (
    addressData.longitude !== null &&
    addressData.longitude !== undefined &&
    !Number.isNaN(parseFloat(addressData.longitude))
  ) {
    locationObj.longitude = parseFloat(addressData.longitude);
  }

  if (locationId != null && locationId !== '') {
    locationObj.id = Number(locationId);
  }

  return locationObj;
};

export const createEmptyLocationForm = () => ({
  locationName: '',
  address1: '',
  address2: '',
  country: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: null,
  longitude: null,
  sqft: '',
  isFranchise: '',
});
