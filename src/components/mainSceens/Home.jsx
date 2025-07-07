import React from 'react';
import Wrapper from '../layout/Wrapper';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

function logout() {
  localStorage.removeItem('token');
  navigate('/login');
}
  
  return (
  <Wrapper showSidebar={true}>
    <div className='flex items-center justify-between w-full'>
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p>Welcome to the Growlio Home page!</p>

      <button className='bg-blue-500 text-white p-2 rounded-md' onClick={logout}>Logout</button>
    </div>
  </Wrapper>
  );
};

export default Home; 