import React from 'react';
import { Tooltip } from 'antd';
import SubTrack from '../../assets/svgs/Subtract.svg';
import formatTooltipContent from '../../utils/formatTooltipContent';

const TooltipIcon = ({ text }) => {
  if (!text) return null;

  const title = formatTooltipContent(text);

  return (
    <span className="ml-2 align-middle inline-block mb-0.5">
      <Tooltip placement="bottomLeft" title={title}>
        <img src={SubTrack} alt="SubTrack" className="inline-block align-middle w-4 h-4" aria-describedby=":r2b:" />
      </Tooltip>
    </span>
  );
};

export default TooltipIcon;
