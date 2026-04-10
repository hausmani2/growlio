import React, { useMemo, useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import useTooltips from '../../../utils/useTooltips';
import TooltipIcon from '../../common/TooltipIcon';

const TRAINING_VIDEOS = {
  budgetDashboard: {
    title: 'How to create a Budget Dashboard',
    modalTitle: 'Budget Dashboard Tutorial',
    embedUrl: 'https://www.youtube.com/embed/2-9RvD6wQq8?rel=0'
  },
  budgetUse: {
    title: 'How to Use My Budget',
    modalTitle: 'How to Use My Budget Tutorial',
    embedUrl: 'https://www.youtube.com/embed/KYXWhQk_kGA?rel=0'
  },
  weeklyData: {
    title: 'How To Enter My Weekly Data',
    modalTitle: 'Enter Weekly Data Tutorial',
    embedUrl: 'https://www.youtube.com/embed/iEWn2Atanws?rel=0'
  }
};

const Training = () => {
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [activeVideoKey, setActiveVideoKey] = useState('budgetDashboard');
  const tooltips = useTooltips('training');

  const activeVideo = useMemo(
    () => TRAINING_VIDEOS[activeVideoKey] || TRAINING_VIDEOS.budgetDashboard,
    [activeVideoKey]
  );

  return (
    <div className="w-full mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-orange-600">
                Training
                <TooltipIcon text={tooltips?.header} />
              </h1>
              <button
                onClick={() => {
                  setActiveVideoKey('budgetDashboard');
                  setIsVideoModalVisible(true);
                }}
                className="text-orange-600 hover:text-orange-700 transition-colors"
                title="Watch tutorial video"
                aria-label="Watch training video"
                type="button"
              >
                <InfoCircleOutlined className="text-lg" />
              </button>
            </div>
            <p className="text-gray-600 text-lg">
              Comprehensive training resources and guides to help you master Growlio
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-base text-orange-600">
              Watch a tutorial on how to create a <span className="text-purple-600">Budget Dashboard</span>
            </p>
            <button
              onClick={() => {
                setActiveVideoKey('budgetDashboard');
                setIsVideoModalVisible(true);
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-base border border-blue-600 rounded-md px-4 py-2"
              title="Watch Budget Dashboard Tutorial"
              aria-label="Watch Budget Dashboard Tutorial"
              type="button"
            >
              Watch Video
            </button>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-base text-orange-600">
              Watch a tutorial on <span className="text-purple-600">How to Use My Budget</span>
            </p>
            <button
              onClick={() => {
                setActiveVideoKey('budgetUse');
                setIsVideoModalVisible(true);
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-base border border-blue-600 rounded-md px-4 py-2"
              title="Watch How to Use My Budget Tutorial"
              aria-label="Watch How to Use My Budget Tutorial"
              type="button"
            >
              Watch Video
            </button>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-base text-orange-600">
              Watch a tutorial on <span className="text-purple-600">How To Enter My Weekly Data</span>
            </p>
            <button
              onClick={() => {
                setActiveVideoKey('weeklyData');
                setIsVideoModalVisible(true);
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-base border border-blue-600 rounded-md px-4 py-2"
              title="Watch Enter Weekly Data Tutorial"
              aria-label="Watch Enter Weekly Data Tutorial"
              type="button"
            >
              Watch Video
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={activeVideo.modalTitle}
        open={isVideoModalVisible}
        onCancel={() => setIsVideoModalVisible(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose={true}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            src={activeVideo.embedUrl}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </div>
  );
};

export default Training;
