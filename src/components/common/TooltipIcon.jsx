import React from 'react';
import { Tooltip } from 'antd';
import SubTrack from '../../assets/svgs/Subtract.svg';

const TooltipIcon = ({ text }) => {
  if (!text) return null;
  return (
    <span className="ml-2 align-middle inline-block">
      <Tooltip placement="bottomLeft" title={text}>
        <img src={SubTrack} alt="SubTrack" className="inline-block align-middle w-4 h-4" aria-describedby=":r2b:" />
      </Tooltip>
    </span>
  );
};

export default TooltipIcon;


