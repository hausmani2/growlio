import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import lioMascot from '../../assets/pngs/lio-mascot.png';
import lioConnectMascot from '../../assets/pngs/lio-connect-mascot.png';
import useStore from '../../store/store';
import OnboardingPosImport from '../profitability/OnboardingPosImport';
import {
  ONBOARDING_ROUTES,
  getSetupPlanChoice,
  isPaidPosPlan,
  markBudgetPosPrompt,
  markPosUpgradeReturn,
  markSetupPlanChoice,
  persistConnectPosReturn,
  readConnectPosReturn,
} from '../../utils/onboardingUtils';

const DEFAULT_SETUP_NEXT = '/dashboard/basic-information';
const DEFAULT_BUDGET_NEXT = ONBOARDING_ROUTES.DASHBOARD_BUDGET;

const BENEFITS = [
  { icon: LineChartOutlined, label: 'Imports 4 weeks of sales by day' },
  { icon: TeamOutlined, label: 'Imports 4 weeks of labor by day' },
  { icon: CheckCircleFilled, label: 'Automatically creates your first budget' },
  { icon: ClockCircleOutlined, label: 'Get up and running in minutes' },
];

const SetupStepper = ({ current, steps, mutedDone = false }) => {
  const lastIndex = steps.length - 1;
  const onLastStep = current >= steps.length;
  const greenSegments = onLastStep ? Math.max(0, lastIndex - 1) : Math.max(0, current - 1);
  const greenPercent = lastIndex > 0 ? (greenSegments / lastIndex) * 100 : 0;

  return (
    <div className="relative mx-auto mb-8 w-full max-w-[820px]">
      <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-[15px] h-[2px] rounded-full bg-[#e5e7eb]" />
      <div
        className="pointer-events-none absolute left-[16.67%] top-[15px] h-[2px] rounded-full bg-[#4ade80]"
        style={{ width: `calc((100% - 33.34%) * ${greenPercent / 100})` }}
      />
      {onLastStep && lastIndex > 0 ? (
        <div className="pointer-events-none absolute left-1/2 right-[16.67%] top-[15px] h-[2px] rounded-full bg-gradient-to-r from-[#4ade80] to-[#f97316]" />
      ) : null}
      <ol
        className="relative grid w-full"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const number = index + 1;
          const isDone = number < current;
          const isCurrent = number === current;

          return (
            <li key={step.label} className="flex flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isDone
                    ? 'bg-[#22c55e] text-white'
                    : isCurrent
                      ? 'bg-[#f97316] text-white'
                      : 'bg-[#e5e7eb] text-[#9ca3af]'
                }`}
              >
                {isDone ? <CheckCircleFilled className="text-sm" /> : number}
              </div>
              <p
                className={`mt-2 text-[13px] font-medium leading-tight ${
                  isDone
                    ? mutedDone
                      ? 'text-[#64748b]'
                      : 'text-[#16a34a]'
                    : isCurrent
                      ? 'text-[#ea580c]'
                      : 'text-[#9ca3af]'
                }`}
              >
                {step.label}
              </p>
              {step.hint ? (
                <p className="text-[11px] text-[#9ca3af] leading-tight">{step.hint}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const LIO_IMG_CLASS = 'block h-auto w-[240px] sm:w-[280px] lg:w-[320px] max-w-none';
const TITLE_CLASS = 'text-[32px] sm:text-[42px] font-extrabold text-[#0f172a] leading-[1.12]';
const BODY_CLASS = 'mt-3 text-[15px] text-slate-500 leading-relaxed';

const HandwrittenCaption = ({ children }) => (
  <div className="absolute right-0 top-3 w-[140px] sm:top-5 sm:w-[160px] rotate-[10deg]">
    <p
      className="text-[26px] sm:text-[30px] font-bold leading-[1.05] text-[#1e3a8a]"
      style={{ fontFamily: "'Caveat', cursive" }}
    >
      {children}
    </p>
    <svg
      className="ml-10 mt-0.5 text-[#f97316]"
      width="54"
      height="28"
      viewBox="0 0 54 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 8 C18 2, 34 6, 48 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M40 12 L50 20 L38 22"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const LioMascot = () => (
  <div className="relative mx-auto w-fit pr-24 sm:pr-28 lg:pr-32 shrink-0">
    <img src={lioMascot} alt="LIO" className={LIO_IMG_CLASS} />
    <HandwrittenCaption>
      Let LIO do
      <br />
      the work
      <br />
      for you!
    </HandwrittenCaption>
  </div>
);

const ConnectLioMascot = () => (
  <div className="relative mx-auto w-fit pr-24 sm:pr-28 lg:pr-32 shrink-0">
    <img src={lioConnectMascot} alt="LIO" className={LIO_IMG_CLASS} />
    <HandwrittenCaption>
      Almost there!
      <br />
      Let&apos;s get
      <br />
      your data!
    </HandwrittenCaption>
  </div>
);

const SquareLogo = () => (
  <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] bg-black">
    <span className="h-3.5 w-3.5 rounded-[3px] border-[2px] border-white" />
  </span>
);

const ToastLogo = () => (
  <span className="inline-flex items-center gap-1.5">
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FF6900"
        d="M4 5.5C4 3.57 5.57 2 7.5 2h9C18.43 2 20 3.57 20 5.5V13c0 1.93-1.57 3.5-3.5 3.5H13l-4.2 4.2c-.5.5-1.3.15-1.3-.55V16.5H7.5C5.57 16.5 4 14.93 4 13V5.5Z"
      />
    </svg>
    <span className="text-[20px] font-extrabold tracking-tight text-[#FF6900] leading-none">
      toast
    </span>
  </span>
);

const POS_PROVIDERS = [
  { id: 'square', available: true, label: 'Square' },
  { id: 'toast', available: false, label: 'Toast' },
];

const PosOption = ({ selected, onSelect, brand = 'square', connected = false, children }) => {
  const selectedStyles =
    brand === 'toast'
      ? 'bg-white text-[#9a3412] shadow-[0_6px_16px_rgba(255,105,0,0.14)] ring-2 ring-[#FF6900]'
      : connected
        ? 'bg-white text-[#0f172a] shadow-[0_6px_16px_rgba(22,163,74,0.14)] ring-2 ring-[#16a34a]'
        : 'bg-white text-[#0f172a] shadow-[0_6px_16px_rgba(15,23,42,0.10)] ring-2 ring-slate-900';
  const dotStyles = selected
    ? brand === 'toast'
      ? 'border-[#FF6900] bg-[#FF6900]'
      : connected
        ? 'border-[#16a34a] bg-[#16a34a]'
        : 'border-slate-900 bg-slate-900'
    : 'border-slate-300 bg-white';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex flex-1 items-center justify-center gap-2.5 rounded-[14px] px-3 py-3 min-h-[58px] transition-all duration-200 ${
        selected ? selectedStyles : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
      }`}
    >
      <span className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 ${dotStyles}`}>
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      {children}
      {connected ? (
        <span className="absolute -top-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#15803d]">
          <CheckCircleFilled className="text-[10px]" />
          Connected
        </span>
      ) : null}
    </button>
  );
};

const OnboardingConnectPosPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetchCurrentSubscriptionDetails = useStore((state) => state.fetchCurrentSubscriptionDetails);
  const subscriptionDetails = useStore((state) => state.subscriptionDetails);
  const currentPackage = useStore((state) => state.currentPackage);
  const squareStatus = useStore((state) => state.squareStatus);
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  const restaurantId = localStorage.getItem('restaurant_id');
  const markedSetupSeenRef = useRef(false);
  const [selectedPos, setSelectedPos] = useState('square');
  const selectedProvider = POS_PROVIDERS.find((pos) => pos.id === selectedPos) || POS_PROVIDERS[0];
  const isSquareConnected = squareStatus === 'connected';

  const storedReturn = readConnectPosReturn();
  const from = searchParams.get('from') || storedReturn.from || 'budget';
  const next =
    searchParams.get('next') ||
    storedReturn.next ||
    (from === 'setup' ? DEFAULT_SETUP_NEXT : DEFAULT_BUDGET_NEXT);
  const upgradedFromCheckout = searchParams.get('upgraded') === '1';
  const canImportFromPos = isPaidPosPlan(subscriptionDetails?.package || currentPackage);
  const showConnectView = upgradedFromCheckout || canImportFromPos;

  useEffect(() => {
    fetchCurrentSubscriptionDetails?.(true);
  }, [fetchCurrentSubscriptionDetails]);

  useEffect(() => {
    if (restaurantId) checkSquareStatus?.(restaurantId);
  }, [restaurantId, checkSquareStatus]);

  useEffect(() => {
    persistConnectPosReturn({ next, from });
  }, [from, next]);

  useEffect(() => {
    if (from !== 'setup' || markedSetupSeenRef.current) return;
    markedSetupSeenRef.current = true;
    if (!getSetupPlanChoice()) markSetupPlanChoice('seen');
  }, [from]);

  const handleKeepFree = () => {
    markSetupPlanChoice('free');
    if (from === 'budget') markBudgetPosPrompt('free');
    navigate(next, { replace: true });
  };

  const handleUpgrade = () => {
    persistConnectPosReturn({ next, from });
    markPosUpgradeReturn();
    navigate(ONBOARDING_ROUTES.PLANS);
  };

  const handleDoLater = () => {
    markSetupPlanChoice('later');
    if (from === 'budget') markBudgetPosPrompt('later');
    navigate('/dashboard/pos-integrations', { replace: true });
  };

  const handleImportFinished = () => {
    markSetupPlanChoice('upgraded');
    markBudgetPosPrompt('imported');
    navigate(ONBOARDING_ROUTES.DASHBOARD_BUDGET, { replace: true });
  };

  return (
    <div className="w-full">
      <div className="rounded-xl bg-white shadow-lg border border-gray-100 px-6 py-6 sm:px-10 sm:py-8 lg:px-16">
          <div className="mb-2 flex items-start justify-end">
            <p className="text-xs text-slate-400 text-right leading-5">
              {showConnectView ? 'Step 3 of 3' : 'Step 2 of 3'}
              <br />
              Restaurant Setup
            </p>
          </div>

          {showConnectView ? (
            <>
              <SetupStepper
                current={3}
                mutedDone
                steps={[
                  { label: 'Create Account' },
                  { label: 'Upgrade to Pro' },
                  { label: 'Connect POS' },
                ]}
              />

              <div className="mx-auto flex max-w-[980px] flex-col items-center lg:flex-row lg:items-start lg:justify-center gap-8 lg:gap-12">
                <div className="w-full max-w-xl">
                  <h2 className={TITLE_CLASS}>
                    You&apos;re upgraded!
                    <span className="block">Let&apos;s build your first budget.</span>
                  </h2>
                  <p className={BODY_CLASS}>
                    Connect your POS and LIO will import your last 4 weeks of sales and labor by day
                    and automatically create your starting budget.
                  </p>
                </div>
                <ConnectLioMascot />
              </div>

              <div className="mx-auto mt-2 max-w-[620px]">
                <div
                  className="flex flex-col sm:flex-row sm:items-stretch gap-2 rounded-2xl bg-[#f4f6fb] p-2"
                  role="radiogroup"
                  aria-label="Choose your POS"
                >
                  <PosOption
                    selected={selectedPos === 'square'}
                    onSelect={() => setSelectedPos('square')}
                    brand="square"
                    connected={isSquareConnected}
                  >
                    <span className={`inline-flex items-center gap-2.5 font-bold ${selectedPos === 'square' ? 'text-[#0f172a]' : 'opacity-60'}`}>
                      <SquareLogo />
                      Square
                    </span>
                  </PosOption>
                  <PosOption
                    selected={selectedPos === 'toast'}
                    onSelect={() => setSelectedPos('toast')}
                    brand="toast"
                  >
                    <span className={selectedPos === 'toast' ? '' : 'opacity-60'}>
                      <ToastLogo />
                    </span>
                  </PosOption>
                  <div className="flex flex-1 items-center justify-center px-3 py-2 text-center">
                    <p className="text-[13px] leading-snug text-slate-400">
                      More POS integrations
                      <br />
                      coming soon.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  {selectedProvider.available ? (
                    <OnboardingPosImport
                      restaurantId={restaurantId}
                      planLocked={false}
                      hero
                      defaultPreset="last_4_weeks"
                      showOrHeading={false}
                      hideUpgradeCta
                      connectButtonLabel="Connect POS / Sync Now"
                      importButtonLabel="Sync Now"
                      helperText=""
                      successMessage="Last 4 weeks imported from Square. Opening your budget."
                      onFinished={handleImportFinished}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        message.info(
                          `${selectedProvider.label} POS is coming soon. Square is available now.`
                        )
                      }
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] text-base font-semibold text-white hover:bg-[#1d4ed8]"
                    >
                      Connect POS / Sync Now
                    </button>
                  )}
                </div>

                <p className="mt-3 text-center text-[14px] text-slate-500 leading-relaxed">
                  {!selectedProvider.available
                    ? `${selectedProvider.label} integration is coming soon. Select Square to connect and import now.`
                    : isSquareConnected
                      ? 'Square is already connected. Sync now to import your last 4 weeks of sales and labor.'
                      : 'LIO will import your last 4 weeks of sales and labor by day, then create your first budget.'}
                </p>

                <div className="mt-2 flex items-center gap-4">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[12px] font-semibold tracking-[0.18em] text-slate-400">OR</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={handleDoLater}
                    className="min-w-[240px] rounded-2xl border border-slate-300 bg-white px-8 py-3 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    I&apos;ll do this later
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <SetupStepper
                current={2}
                steps={[
                  { label: 'Create Account' },
                  { label: 'Connect POS', hint: '(Optional)' },
                  { label: 'Go To Your Budget' },
                ]}
              />

              <div className="mx-auto flex max-w-[980px] flex-col items-center lg:flex-row lg:items-start lg:justify-center gap-8 lg:gap-12">
                <div className="w-full max-w-xl">
                  <h2 className={TITLE_CLASS}>
                    Connect Your POS & Let LIO Build Your Budget
                  </h2>
                  <p className={BODY_CLASS}>
                    Upgrade to Pro and connect your Point of Sale. LIO will import your last 4 weeks
                    of sales and labor by day and automatically create your first budget.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-xl">
                    {BENEFITS.map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#f97316] shadow-sm">
                          <Icon className="text-base" />
                        </span>
                        <span className="text-[13px] font-medium text-slate-600 leading-snug">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col min-h-[180px]">
                      <p className="text-[18px] font-bold text-[#0f172a]">Keep Free Plan</p>
                      <p className="mt-1 text-sm text-slate-500">I&apos;ll create my budget manually.</p>
                      <button
                        type="button"
                        onClick={handleKeepFree}
                        className="mt-auto w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Continue to My Budget
                      </button>
                    </div>

                    <div className="relative rounded-2xl border-[1.5px] border-[#fb923c] bg-[#fff7ed] p-5 flex flex-col min-h-[180px]">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#f97316] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Recommended
                      </span>
                      <p className="text-[18px] font-bold text-[#ea580c]">Upgrade to Pro</p>
                      <p className="mt-1 text-sm text-[#9a3412]/80">
                        Connect my POS and let LIO build my first budget.
                      </p>
                      <button
                        type="button"
                        onClick={handleUpgrade}
                        className="mt-auto w-full rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ea580c]"
                      >
                        Upgrade to Pro & Connect POS
                      </button>
                    </div>
                  </div>
                </div>

                <LioMascot />
              </div>
            </>
          )}
           <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-400">
            <InfoCircleOutlined />
            You can always connect your POS later from Settings.
          </p>
      </div>
    </div>
  );
};

export default OnboardingConnectPosPage;
