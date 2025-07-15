import React, { useState } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/Lock.svg"
import User from "../../../assets/svgs/User.svg"
import PrimaryBtn from '../../buttons/Buttons';
import { Link } from 'react-router-dom';
import { Input } from 'antd';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  // const register = useStore((state) => state.register);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      navigate('/onboarding');
      // Replace with your actual registration API call
      // Example: const { user, token } = await apiRegister(form);
      // register(user, token);
      // For now, fake registration:
      if (form.email && form.password && form.name && form.username) {
        // register({ email: form.email, name: form.name, username: form.username }, 'fake-token');
        localStorage.setItem('token', 'fake-token');
        setSuccess('Registration successful!');
        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error('Please fill in all fields');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-8 space-y-2"
      >
        <img src={logo} alt="logo" className="mb-6" />
        <div className='flex flex-col mt-4 gap-3'>
          <h2 className="text-lg !font-black text-start text-neutral !mb-0">
            Join Growlio Today
          </h2>
          <p className="text-base text-neutral mb-2" >
            Get discovered, manage bookings, and showcase your menu — all in one place.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="name">Full Name</label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Write Full Name"
              prefix={<img src={User} alt="User" className="h-4 w-4" />}
              size="large"
              className="h-[40px] rounded-md text-lg tw-input input-brand"

            />
          </div>
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="email">Email Address</label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Write Email Address"
              prefix={<img src={Message} alt="Message" className="h-4 w-4" />}
              size="large"
              className="h-[40px] rounded-md text-lg tw-input input-brand"

            />
          </div>
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="username">Username</label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="Write Username"
              prefix={<img src={User} alt="User" className="h-4 w-4" />}
              size="large"
              className="h-[40px] rounded-md text-lg tw-input input-brand"

            />
          </div>
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="password">Password</label>
            <Input.Password
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Write Password"
              prefix={<img src={Lock} alt="Lock" className="h-4 w-4" />}
              size="large"
              className="h-[40px] rounded-md text-lg tw-input input-brand"

            />
          </div>
          <div className='flex justify-end items-center'>
            <p className='text-neutral-900 text-sm font-bold'>Forgot Password?</p>
          </div>
        </div>
        {error && <div className="text-red-500 text-center text-sm">{error}</div>}
        {success && <div className="text-green-500 text-center text-sm">{success}</div>}
        <PrimaryBtn
          className="w-full btn-brand"
          title={loading ? 'Creating account...' : 'Create Account'}
          disabled={loading}
          onClick={()=>{navigate('/congratulations')}}
        />
      </form>
      <div className='flex justify-center items-center mt-6'>
        <p className='text-neutral-600 text-base font-bold'>
          Already have an account? <Link to="/login" className='text-[#FF8132] font-bold hover:text-[#EB5B00]'>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
