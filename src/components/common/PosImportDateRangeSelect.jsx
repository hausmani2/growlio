import React, { useMemo, useState } from 'react';
import { DatePicker, Select, Typography, message } from 'antd';
import dayjs from 'dayjs';
import {
  getPosImportRangeForPreset,
  isPosImportDateDisabled,
  isPosImportRangeAllowed,
  POS_IMPORT_MAX_DAYS,
  POS_IMPORT_PRESET_OPTIONS,
} from '../../services/posApi';

const { RangePicker } = DatePicker;
const { Text } = Typography;

/**
 * Dropdown-first date range picker for POS imports.
 * Options: Last week, Last 30 days, Last month, Custom range.
 */
const PosImportDateRangeSelect = ({
  value,
  onChange,
  disabled = false,
  size = 'middle',
  className = '',
  defaultPreset = 'last_month',
}) => {
  const [preset, setPreset] = useState(defaultPreset);

  const optionList = useMemo(
    () =>
      POS_IMPORT_PRESET_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    []
  );

  const handlePresetChange = (nextPreset) => {
    setPreset(nextPreset);
    if (nextPreset === 'custom') return;
    const nextRange = getPosImportRangeForPreset(nextPreset, dayjs);
    if (nextRange) onChange?.(nextRange);
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <Select
        className="w-full"
        size={size}
        value={preset}
        disabled={disabled}
        options={optionList}
        onChange={handlePresetChange}
      />

      {preset === 'custom' && (
        <>
          <RangePicker
            className="w-full"
            size={size}
            value={value}
            allowClear={false}
            disabled={disabled}
            disabledDate={(current, info) => isPosImportDateDisabled(current, info, dayjs)}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                if (!isPosImportRangeAllowed(dates[0], dates[1], dayjs)) {
                  message.warning(
                    `Please select a range of ${POS_IMPORT_MAX_DAYS} days or fewer.`
                  );
                  return;
                }
                onChange?.(dates);
              }
            }}
          />
          <Text type="secondary" className="text-xs block">
            Maximum {POS_IMPORT_MAX_DAYS} days.
          </Text>
        </>
      )}
    </div>
  );
};

export default PosImportDateRangeSelect;
