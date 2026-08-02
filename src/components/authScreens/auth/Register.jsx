import React, { useState, useEffect, useRef } from 'react';
import useStore from '../../../store/store';
import { useNavigate, Link } from 'react-router-dom';
import Message from '../../../assets/svgs/Message_open.svg';
import { Input, message, Button, Checkbox, Tooltip, Modal, Tabs } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import growlioLogo from '../../../assets/svgs/growlio-logo.png';
import TermsOfService from '../../legal/TermsOfService';
import PrivacyPolicy from '../../legal/PrivacyPolicy';
import DataProcessingAgreement from '../../legal/DataProcessingAgreement';

const Register = () => {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState('terms');
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const isRegisterInProgressRef = useRef(false);

  const { register, loading, error, clearError } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (useStore.getState().isAuthenticated && !isRegisterInProgressRef.current) {
      navigate('/congratulations', { replace: true, state: { skipSetupCheck: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      try {
        clearError();
      } catch (err) {
        console.warn('Error during cleanup:', err);
      }
    };
  }, [clearError]);

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!disclaimerAccepted) {
      errors.terms = 'Please accept the terms to continue';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    isRegisterInProgressRef.current = true;

    try {
      const result = await register({ email: email.trim().toLowerCase() });

      if (result.success) {
        setIsSubmitting(false);

        if (result.needsLogin || result.requiresVerification) {
          isRegisterInProgressRef.current = false;
          setRegisteredEmail(email.trim().toLowerCase());
          setIsVerifyEmailModalOpen(true);
        } else {
          // @grw.com (and any auto-authenticated signup): tokens returned
          message.success('Registration successful! Welcome to Growlio!');
          navigate('/congratulations', { replace: true, state: { skipSetupCheck: true } });
        }
      } else {
        isRegisterInProgressRef.current = false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      isRegisterInProgressRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Boolean(email.trim()) && disclaimerAccepted;
  const isLoading = loading || isSubmitting;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <img src={growlioLogo} alt="Growlio Logo" className="w-48 mx-auto" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-3">
            Join Growlio Today!{' '}
            <span role="img" aria-label="rocket" className="text-2xl">
              🚀
            </span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto px-4">
            Enter your email to get started. We&apos;ll send a link to set your password.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                if (error) clearError();
              }}
              placeholder="Enter your email address"
              prefix={<img src={Message} alt="Email" className="h-5 w-5 text-gray-400" />}
              size="large"
              className={`!h-11 rounded-lg text-base transition-all duration-200 ${
                formErrors.email
                  ? '!border-red-500 !shadow-sm !shadow-red-100'
                  : '!border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100'
              }`}
              status={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && (
              <div className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                {formErrors.email}
              </div>
            )}
          </div>

          <div
            className="bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsLegalModalOpen(true)}
          >
            <div className="flex items-start gap-3">
              <Tooltip title={disclaimerAccepted ? 'Accepted' : 'Please review and accept'}>
                <Checkbox
                  checked={disclaimerAccepted}
                  className="mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsLegalModalOpen(true);
                  }}
                />
              </Tooltip>
              <div className="flex-1">
                <p
                  className={`text-sm leading-relaxed ${
                    disclaimerAccepted ? 'text-gray-500' : 'text-gray-700'
                  }`}
                >
                  To Proceed, you agree to Growlio&apos;s{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLegalTab('terms');
                      setIsLegalModalOpen(true);
                    }}
                    className="text-orange-600 font-semibold hover:text-orange-700 underline"
                  >
                    Terms &amp; Conditions
                  </Link>
                  ,{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLegalTab('privacy');
                      setIsLegalModalOpen(true);
                    }}
                    className="text-orange-600 font-semibold hover:text-orange-700 underline"
                  >
                    Privacy Policy
                  </Link>
                  , and{' '}
                  <Link
                    to="/dpa"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLegalTab('dpa');
                      setIsLegalModalOpen(true);
                    }}
                    className="text-orange-600 font-semibold hover:text-orange-700 underline"
                  >
                    Data Processing Agreement
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3" />
              <p className="text-red-700 text-sm font-medium">
                {typeof error === 'string'
                  ? error
                  : error?.email?.[0] || error?.detail || 'Registration failed'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            disabled={!isFormValid}
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base rounded-lg shadow-lg"
            icon={isLoading ? <LoadingOutlined /> : null}
          >
            {isLoading ? 'Creating Account...' : 'Continue with Email'}
          </Button>
        </div>
      </form>

      <div className="text-center mt-8">
        <p className="text-gray-600 text-base">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-orange-600 font-semibold hover:text-orange-700 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>

      <Modal
        title="Growlio Agreements"
        open={isLegalModalOpen}
        onCancel={() => setIsLegalModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsLegalModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="accept"
            type="primary"
            onClick={() => {
              setDisclaimerAccepted(true);
              setIsLegalModalOpen(false);
            }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 border-0"
          >
            I Agree
          </Button>,
        ]}
        width={980}
        centered
        destroyOnClose
        styles={{ body: { paddingTop: 8 } }}
      >
        <Tabs
          activeKey={activeLegalTab}
          onChange={setActiveLegalTab}
          items={[
            {
              key: 'terms',
              label: 'Terms & Conditions',
              children: (
                <div className="max-h-[65vh] overflow-auto pr-2">
                  <TermsOfService variant="modal" />
                </div>
              ),
            },
            {
              key: 'privacy',
              label: 'Privacy Policy',
              children: (
                <div className="max-h-[65vh] overflow-auto pr-2">
                  <PrivacyPolicy variant="modal" />
                </div>
              ),
            },
            {
              key: 'dpa',
              label: 'Data Processing Agreement',
              children: (
                <div className="max-h-[65vh] overflow-auto pr-2">
                  <DataProcessingAgreement variant="modal" />
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title="Check your email"
        open={isVerifyEmailModalOpen}
        onCancel={() => {
          setIsVerifyEmailModalOpen(false);
          navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
        }}
        footer={[
          <Button
            key="gmail"
            onClick={() => window.open('https://mail.google.com/', '_blank', 'noopener,noreferrer')}
          >
            Open Gmail
          </Button>,
          <Button
            key="continue"
            type="primary"
            onClick={() => {
              setIsVerifyEmailModalOpen(false);
              navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
            }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 border-0"
          >
            Continue
          </Button>,
        ]}
        centered
      >
        <div className="space-y-2">
          <p className="text-gray-700">
            We sent a link to set your password. Open that email anytime — the link stays
            valid until you finish setup.
          </p>
          {registeredEmail && (
            <p className="text-sm text-gray-600">
              Sent to: <span className="font-semibold text-gray-800">{registeredEmail}</span>
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Register;
