import React from 'react';
import { TabProvider } from '../restaurantsInformation/TabContext';
import Profile from './Profile';

const ProfileWrapper = () => {
  return (
    <TabProvider>
      <Profile />
    </TabProvider>
  );
};

export default ProfileWrapper;
