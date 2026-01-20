import React, { useState, useEffect } from 'react';
import { Checkbox } from 'antd';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const ALL_DAYS = DAYS_OF_WEEK.map(day => day.value);

const OperatingDaysStep = ({ data, updateData, onNext, onBack }) => {
  // Ensure data is always an array
  const initialDays = Array.isArray(data) ? data : [];
  const [selectedDays, setSelectedDays] = useState(initialDays);

  // Check if all days are selected
  const allDaysSelected = ALL_DAYS.every(day => selectedDays.includes(day));

  useEffect(() => {
    updateData(selectedDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays]);

  const toggleDay = (day) => {
    setSelectedDays(prev => {
      // Ensure prev is always an array
      const prevArray = Array.isArray(prev) ? prev : [];
      if (prevArray.includes(day)) {
        return prevArray.filter(d => d !== day);
      } else {
        return [...prevArray, day];
      }
    });
  };

  const toggleAllDays = () => {
    if (allDaysSelected) {
      // Deselect all
      setSelectedDays([]);
    } else {
      // Select all
      setSelectedDays([...ALL_DAYS]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Operating Days</h2>
        <p className="text-gray-600">
          Select the days your restaurant is open for business.
        </p>
      </div>

      {/* Select All Days Option */}
      <div
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          allDaysSelected
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={toggleAllDays}
      >
        <Checkbox
          checked={allDaysSelected}
          onChange={toggleAllDays}
          className="text-base"
        >
          <span className="ml-2 font-medium">Select All Days</span>
        </Checkbox>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map(day => {
          const isSelected = Array.isArray(selectedDays) && selectedDays.includes(day.value);
          return (
            <div
              key={day.value}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={(e) => {
                // Prevent double toggle when clicking on checkbox
                if (e.target.type !== 'checkbox') {
                  toggleDay(day.value);
                }
              }}
            >
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleDay(day.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-base"
              >
                <span className="ml-2 font-medium">{day.label}</span>
              </Checkbox>
            </div>
          );
        })}
      </div>

      {selectedDays.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Please select at least one operating day.
          </p>
        </div>
      )}
    </div>
  );
};

export default OperatingDaysStep;