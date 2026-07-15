import React from 'react';
import Login from './auth/Login';

const LoginPage = () => {
  // Do not redirect to /dashboard here on isAuthenticated.
  // That races with Login's post-login onboarding checks and briefly opens the
  // "Finish your setup" gate before the correct route (score / congratulations).
  // Login.jsx handles already-authenticated visits and post-submit redirects.
  return (
    <div className='w-full h-screen flex justify-center items-center'>
        <Login />
    </div>
  );
};

export default LoginPage;