import React, { useState } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/Lock.svg"
import PrimaryBtn from '../../buttons/Buttons';
import { Link } from 'react-router-dom';
import { Input } from 'antd';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  // const login = useStore((state) => state.login);
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
    try {
      // Replace with your actual login API call
      // Example: const { user, token } = await apiLogin(form);
      // login(user, token);
      // For now, fake login:
      if (form.email === 'test@email.com' && form.password === 'password') {
        // login({ email: form.email }, 'fake-token');
        localStorage.setItem('token', 'fake-token');
        navigate('/');
      } else {
        throw new Error('Invalid credentials');
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
          <h5 className="text-lg !font-black text-start text-neutral drop-shadow !mb-0" >
            Login <span role="img" aria-label="peace">✌️</span>
          </h5>
          <p className="text-base text-neutral mb-8 font-medium" >
            Know Your Number and Grow Your Profits. Welcome to Growlio
          </p>
        </div>
        <div className="flex flex-col gap-4">
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
              prefix={<img src={Message} alt="Message" className="h-6 w-6" />}
              size="large"
              className="h-[40px] rounded-md text-lg tw-input input-brand "
            />
          </div>
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="password" >Password</label>
            <Input.Password
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Write Password"
              prefix={<img src={Lock} alt="Lock" className="h-6 w-6" />}
              size="large"
              className="h-[40px] rounded-md text-lg tw-input input-brand"
            />
          </div>
          <div className='flex justify-end items-center'>
            <p className='text-neutral-900 text-sm font-bold'>Forgot Password?</p>
          </div>
        </div>
        {error && <div className="text-red-500 text-center text-sm">{error}</div>}
        <PrimaryBtn
            className="w-full btn-brand"
          title={loading ? 'Logging in...' : 'Login'}
          disabled={loading}
        />
      </form>
      <div className='flex justify-center items-center mt-6'>
        <p className='text-neutral-600 text-base font-bold'>
          Don't have an account? <Link to="/signup" className='text-[#FF8132] font-bold hover:text-[#EB5B00]'>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
