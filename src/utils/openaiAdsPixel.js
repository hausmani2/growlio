const OPENAI_PIXEL_ID = 'B8ZfZ4FfM4ofmxLkfncCv5';
const SIGNUP_TRACKED_KEY = 'oaiq_registration_completed';

const sha256Hex = async (value) => {
  if (!value || !window.crypto?.subtle) return null;
  const data = new TextEncoder().encode(String(value).trim().toLowerCase());
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const trackOpenAiRegistrationCompleted = async ({ email } = {}) => {
  if (typeof window === 'undefined' || typeof window.oaiq !== 'function') {
    return;
  }

  try {
    if (sessionStorage.getItem(SIGNUP_TRACKED_KEY)) return;
  } catch {
    // Ignore storage errors and still send the event.
  }

  if (email) {
    try {
      const emailSha256 = await sha256Hex(email);
      if (emailSha256) {
        window.oaiq('init', {
          pixelId: OPENAI_PIXEL_ID,
          user: { email_sha256: emailSha256 },
        });
      }
    } catch {
      // Matching data is optional; still send the conversion.
    }
  }

  window.oaiq('measure', 'registration_completed', { type: 'customer_action' });

  try {
    sessionStorage.setItem(SIGNUP_TRACKED_KEY, '1');
  } catch {
    // Ignore storage errors.
  }
};
