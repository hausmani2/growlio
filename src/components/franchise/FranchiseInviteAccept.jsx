import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Spin, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import useStore from '../../store/store';
import {
  clearFranchiseInviteReturn,
  setFranchiseInviteReturn,
} from '../../utils/franchiseContext';

const { Title, Paragraph, Text } = Typography;

const FranchiseInviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const autoJoinAttempted = useRef(false);

  const loadPreview = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/restaurant_v2/franchise/invite/${token}/`);
      setPreview(response?.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          'This invitation link is invalid or expired.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleJoin = useCallback(async () => {
    if (!token || joining || joined) return;
    setJoining(true);
    try {
      await apiPost(`/restaurant_v2/franchise/invite/${token}/accept/`, {});
      setJoined(true);
      message.success('You joined the location network.');
      clearFranchiseInviteReturn();
      // Refresh preview so status shows joined if they stay on the page
      try {
        const response = await apiGet(`/restaurant_v2/franchise/invite/${token}/`);
        setPreview(response?.data);
      } catch (_) {
        /* ignore */
      }
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        (typeof data === 'string' && data) ||
        data?.detail ||
        data?.error ||
        (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
        (typeof data === 'object' &&
          data &&
          Object.values(data).flat?.()?.[0]) ||
        err?.message ||
        'Could not accept invitation.';
      message.error(typeof msg === 'string' ? msg : 'Could not accept invitation.');
      autoJoinAttempted.current = false;
    } finally {
      setJoining(false);
    }
  }, [token, joining, joined]);

  // Creating an account alone does not join — accept must be called.
  // When the invitee returns authenticated, join automatically.
  useEffect(() => {
    if (
      loading ||
      error ||
      !preview?.can_accept ||
      !isAuthenticated ||
      joined ||
      joining ||
      autoJoinAttempted.current
    ) {
      return;
    }
    if (
      user?.email &&
      preview.email &&
      user.email.toLowerCase() !== String(preview.email).toLowerCase()
    ) {
      return;
    }
    autoJoinAttempted.current = true;
    handleJoin();
  }, [
    loading,
    error,
    preview,
    isAuthenticated,
    user?.email,
    joined,
    joining,
    handleJoin,
  ]);

  const goAuth = (path) => {
    const returnTo = `/franchise/invite/${token}`;
    setFranchiseInviteReturn(returnTo);
    navigate(`${path}?next=${encodeURIComponent(returnTo)}`);
  };

  if (loading || (isAuthenticated && preview?.can_accept && !joined && joining)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF6]">
        <div className="text-center">
          <Spin size="large" />
          {joining && (
            <p className="mt-4 text-gray-600">Joining the location network…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF6] px-4 py-10">
      <Card className="w-full max-w-lg shadow-md border-0">
        <Title level={3} className="!text-orange-600 !mb-2">
          Location network invitation
        </Title>
        {error && <Alert type="error" showIcon message={error} className="mb-4" />}
        {!error && preview && (
          <>
            <Paragraph className="text-gray-700">
              <Text strong>{preview.franchisor_name || 'A franchisor'}</Text> invited{' '}
              <Text strong>{preview.contact_name}</Text> to join as{' '}
              <Text strong>{preview.location_name}</Text>.
            </Paragraph>
            <Paragraph type="secondary" className="!mb-4">
              Invitation email: {preview.email}
            </Paragraph>
            {joined || preview.status === 'joined' ? (
              <Alert
                type="success"
                showIcon
                message="You're linked. Continue to your dashboard to finish setup."
                className="mb-4"
              />
            ) : !preview.can_accept ? (
              <Alert
                type="info"
                showIcon
                message={`This invitation is ${preview.status || 'unavailable'}.`}
                className="mb-4"
              />
            ) : !isAuthenticated ? (
              preview.needs_password_setup ? (
                <div className="space-y-3">
                  <Alert
                    type="info"
                    showIcon
                    message="Open the Set password & join button in your invitation email to activate your account and join."
                  />
                  <Button onClick={() => goAuth('/login')}>Already set a password? Log in</Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="primary" className="bg-orange-500" onClick={() => goAuth('/login')}>
                    Log in to join
                  </Button>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {user?.email &&
                  preview.email &&
                  user.email.toLowerCase() !== preview.email.toLowerCase() && (
                    <Alert
                      type="warning"
                      showIcon
                      message={`You're signed in as ${user.email}. Accept with ${preview.email}.`}
                    />
                  )}
                <Button
                  type="primary"
                  className="bg-orange-500"
                  loading={joining}
                  onClick={handleJoin}
                >
                  Join network
                </Button>
              </div>
            )}
            {(joined || preview.status === 'joined') && (
              <Button
                type="primary"
                className="bg-orange-500 mt-4"
                onClick={() => navigate('/dashboard')}
              >
                Go to dashboard
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default FranchiseInviteAccept;
