import React, { useMemo, useState } from 'react';
import { PlayCircleFilled, SearchOutlined, BookOutlined } from '@ant-design/icons';
import { Modal, Input } from 'antd';
import useTooltips from '../../../utils/useTooltips';
import TooltipIcon from '../../common/TooltipIcon';

const TRAINING_VIDEOS = [
  {
    key: 'budgetDashboard',
    title: 'How to Create a Budget Dashboard',
    description: 'Set up your budget dashboard and get a clear view of your restaurant targets.',
    category: 'Budget',
    modalTitle: 'Budget Dashboard Tutorial',
    videoId: '2-9RvD6wQq8',
  },
  {
    key: 'budgetUse',
    title: 'How to Use My Budget',
    description: 'Learn how to read, update, and manage your budget day to day.',
    category: 'Budget',
    modalTitle: 'How to Use My Budget Tutorial',
    videoId: 'KYXWhQk_kGA',
  },
  {
    key: 'weeklyData',
    title: 'How to Enter Weekly Data',
    description: 'Enter weekly numbers accurately so your reports stay trustworthy.',
    category: 'Operations',
    modalTitle: 'Enter Weekly Data Tutorial',
    videoId: 'iEWn2Atanws',
  },
  {
    key: 'operatingExpenses',
    title: 'Operating Expenses',
    description: 'Track and organize the operating expenses that impact your margins.',
    category: 'Operations',
    modalTitle: 'Operating Expenses Tutorial',
    videoId: 'XYxZacU_zsk',
  },
  {
    key: 'reportCard',
    title: 'Report Card',
    description: 'Understand your Report Card metrics and what to improve next.',
    category: 'Insights',
    modalTitle: 'Report Card Tutorial',
    videoId: 'XexAdO4ocK0',
  },
  {
    key: 'simulator',
    title: 'How to Use the Simulator',
    description: 'Model scenarios and see how changes affect your restaurant performance.',
    category: 'Tools',
    modalTitle: 'How To Use The Simulator Tutorial',
    videoId: '6EPt76Z-CqM',
  },
];

const CATEGORIES = ['All', 'Budget', 'Operations', 'Insights', 'Tools'];

const getThumbnailUrl = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const getEmbedUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`;

const Training = () => {
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [activeVideoKey, setActiveVideoKey] = useState(TRAINING_VIDEOS[0].key);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const tooltips = useTooltips('training');

  const activeVideo = useMemo(
    () => TRAINING_VIDEOS.find((v) => v.key === activeVideoKey) || TRAINING_VIDEOS[0],
    [activeVideoKey]
  );

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TRAINING_VIDEOS.filter((video) => {
      const matchesCategory = activeCategory === 'All' || video.category === activeCategory;
      const matchesSearch =
        !query ||
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const openVideo = (key) => {
    setActiveVideoKey(key);
    setIsVideoModalVisible(true);
  };

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col gap-4 pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                <BookOutlined className="text-xl text-[#FF8132]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-2">
                  Tutorials
                  <TooltipIcon text={tooltips?.header} />
                </h1>
                <p className="text-gray-600 text-base mt-1 max-w-2xl">
                  Short video guides to help you master Growlio — budgets, weekly data, reports, and more.
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 sm:text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                {TRAINING_VIDEOS.length} tutorials
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lg:max-w-sm"
              size="large"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      isActive
                        ? 'bg-[#FF8132] border-[#FF8132] text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Video grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-10 text-center">
          <p className="text-gray-700 font-medium text-lg">No tutorials found</p>
          <p className="text-gray-500 mt-1">Try a different search or category.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
            }}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-[#FF8132] hover:bg-[#EB5B00] text-white font-medium transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <article
              key={video.key}
              className="group bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:border-orange-200"
            >
              <button
                type="button"
                onClick={() => openVideo(video.key)}
                className="relative block w-full aspect-video bg-gray-100 overflow-hidden text-left"
                aria-label={`Watch ${video.title}`}
              >
                <img
                  src={getThumbnailUrl(video.videoId)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-white/95 text-[#FF8132] shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <PlayCircleFilled className="text-3xl" />
                  </span>
                </div>
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/95 text-gray-700 border border-white/80">
                  {video.category}
                </span>
              </button>

              <div className="p-4 flex flex-col flex-1">
                <h2 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-orange-600 transition-colors">
                  {video.title}
                </h2>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed flex-1">
                  {video.description}
                </p>
                <button
                  type="button"
                  onClick={() => openVideo(video.key)}
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#FF8132] hover:bg-[#EB5B00] text-white font-medium text-sm transition-colors"
                  aria-label={`Watch ${video.title}`}
                >
                  <PlayCircleFilled />
                  Watch Video
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        title={activeVideo.modalTitle}
        open={isVideoModalVisible}
        onCancel={() => setIsVideoModalVisible(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose
      >
        <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full border-0"
            src={getEmbedUrl(activeVideo.videoId)}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {activeVideo.description && (
          <p className="mt-3 text-sm text-gray-600">{activeVideo.description}</p>
        )}
      </Modal>
    </div>
  );
};

export default Training;
