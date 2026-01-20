import React, { useState, useEffect } from 'react';
import { InputNumber } from 'antd';

const LaborInformationStep = ({ data, updateData, onNext, onBack }) => {
  const [avgHourlyRate, setAvgHourlyRate] = useState(data?.avgHourlyRate || 0);

  useEffect(() => {
    updateData({
      avgHourlyRate
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avgHourlyRate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Labor Information</h2>
        <p className="text-gray-600">
          Enter the average hourly rate for all staff roles.
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
            onChange={(value) => setAvgHourlyRate(value || 0)}
            min={0}
            step={0.01}
            precision={2}
            className="w-full h-11"
            prefix="$"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This represents the average hourly rate across all staff roles
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaborInformationStep;