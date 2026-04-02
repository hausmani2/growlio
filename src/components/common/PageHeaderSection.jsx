import React from 'react';

const PageHeaderSection = ({ title, description, right }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">{title}</h1>
          {description ? <p className="text-gray-600 text-lg">{description}</p> : null}
        </div>
        {right ? <div className="flex-shrink-0">{right}</div> : null}
      </div>
    </div>
  );
};

export default PageHeaderSection;

