import React, { useState, useEffect, useCallback } from 'react';
import { Input, message } from 'antd';
import { sanitizeDecimalInput } from '../../../utils/formatUtils';

const LaborInformationStep = ({ data, updateData, onNext, onBack, validateStep }) => {
  const [errors, setErrors] = useState({});
  const [avgHourlyRate, setAvgHourlyRate] = useState(
    data?.avgHourlyRate === 0 || data?.avgHourlyRate
      ? String(data.avgHourlyRate)
      : ''
  );
  const MIN_AVG_HOURLY_RATE = 1;
  const MAX_AVG_HOURLY_RATE = 500;

  useEffect(() => {
    const num = parseFloat(avgHourlyRate);
    updateData({
      avgHourlyRate: Number.isFinite(num) ? num : 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avgHourlyRate]);

  // Validation function that can be called from parent
  // Use useCallback to ensure the function reference is stable and uses latest values
  const validate = useCallback(() => {
    const newErrors = {};
    const rate = parseFloat(avgHourlyRate);
    
    if (!Number.isFinite(rate) || rate <= 0) {
      newErrors.avgHourlyRate = 'Please enter a valid average hourly rate.';
    } else if (rate < MIN_AVG_HOURLY_RATE || rate > MAX_AVG_HOURLY_RATE) {
      newErrors.avgHourlyRate = `Average hourly rate must be between $${MIN_AVG_HOURLY_RATE} and $${MAX_AVG_HOURLY_RATE}.`;
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      message.error(firstError);
      return false;
    }
    
    return true;
  }, [avgHourlyRate]);

  // Expose validate function to parent via validateStep prop
  useEffect(() => {
    if (validateStep) {
      validateStep.current = validate;
    }
  }, [validateStep, validate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Labor Information</h2>
        <p className="text-gray-600">
        What is your estimated average hourly labor rate across all positions?  Not sure? Ask LIO, your Growlio AI assistant.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Hourly Rate <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={avgHourlyRate}
            onChange={(e) => {
              const value = sanitizeDecimalInput(e.target.value);
              const num = parseFloat(value);
              if (Number.isFinite(num) && num > MAX_AVG_HOURLY_RATE) {
                setAvgHourlyRate(String(MAX_AVG_HOURLY_RATE));
              } else {
                setAvgHourlyRate(value);
              }
              if (errors.avgHourlyRate) {
                setErrors(prev => ({ ...prev, avgHourlyRate: '' }));
              }
            }}
            className={`w-full h-11 ${errors.avgHourlyRate ? 'border-red-500' : ''}`}
            prefix="$"
            status={errors.avgHourlyRate ? 'error' : ''}
          />
          {errors.avgHourlyRate && (
            <p className="text-red-500 text-xs mt-1">{errors.avgHourlyRate}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Enter a value between ${MIN_AVG_HOURLY_RATE} and ${MAX_AVG_HOURLY_RATE}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaborInformationStep;