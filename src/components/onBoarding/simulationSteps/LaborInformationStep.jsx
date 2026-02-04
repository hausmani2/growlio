import React, { useState, useEffect, useCallback } from 'react';
import { InputNumber, message } from 'antd';

const LaborInformationStep = ({ data, updateData, onNext, onBack, validateStep }) => {
  const [errors, setErrors] = useState({});
  const [avgHourlyRate, setAvgHourlyRate] = useState(data?.avgHourlyRate || 0);

  useEffect(() => {
    updateData({
      avgHourlyRate
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avgHourlyRate]);

  // Validation function that can be called from parent
  // Use useCallback to ensure the function reference is stable and uses latest values
  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!avgHourlyRate || avgHourlyRate <= 0) {
      newErrors.avgHourlyRate = 'Average Hourly Rate is required and must be greater than 0';
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
          <InputNumber
            placeholder="0.00"
            value={avgHourlyRate}
            onChange={(value) => {
              setAvgHourlyRate(value || 0);
              if (errors.avgHourlyRate) {
                setErrors(prev => ({ ...prev, avgHourlyRate: '' }));
              }
            }}
            min={0}
            step={0.01}
            precision={2}
            className={`w-full h-11 ${errors.avgHourlyRate ? 'border-red-500' : ''}`}
            prefix="$"
            required
            status={errors.avgHourlyRate ? 'error' : ''}
          />
          {errors.avgHourlyRate && (
            <p className="text-red-500 text-xs mt-1">{errors.avgHourlyRate}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This represents the average hourly rate across all staff roles
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaborInformationStep;