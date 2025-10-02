import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import Card from './ui/Card';
import {
  formatDisplayNumber,
  formatNumber,
  normalizeData,
  calculateEngagementRate,
  calculateAverageMetric,
  getBestPerformingContentType,
  getChronologicalContent
} from '../utils/analyticsFormulas';

// Instagram Icon Component
const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsCharts = ({ profile, posts, reels }) => {
  // Get recent 10 posts/reels for charts - arranged chronologically (oldest to newest)
  const recentContent = getChronologicalContent(posts, reels, 10);

  // Calculate real performance metrics using centralized formulas
  const allContent = [...(posts || []), ...(reels || [])];

  const avgViews = calculateAverageMetric(allContent, 'views');
  const avgLikes = calculateAverageMetric(allContent, 'likes');
  const avgComments = calculateAverageMetric(allContent, 'comments');

  const bestContentType = getBestPerformingContentType(posts, reels);

  // Calculate average engagement rate (calculate per post, then average)
  const followers = profile?.profile?.followers || 1; // Use follower count

  // Calculate engagement rate for each post, then average them
  const allEngagementRates = allContent.map(item =>
    calculateEngagementRate(
      formatNumber(item.likes),
      formatNumber(item.comments),
      followers
    )
  );

  const engagementRate = allEngagementRates.length > 0
    ? (allEngagementRates.reduce((sum, rate) => sum + rate, 0) / allEngagementRates.length).toFixed(1)
    : '0.0';

  const chartOptionsWithTooltip = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          padding: window.innerWidth < 640 ? 10 : 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label;
            const originalValue = context.dataset.originalData[context.dataIndex];
            const normalizedValue = context.parsed.y.toFixed(1);

            return `${datasetLabel}: ${formatDisplayNumber(originalValue)} (${normalizedValue}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          callback: function(value) {
            return value.toFixed(1);
          }
        },
        grid: {
          color: '#374151'
        },
        title: {
          display: true,
          text: 'Normalized Scale (0-100%)',
          color: '#9CA3AF',
          font: {
            size: 11
          }
        }
      }
    },
    backgroundColor: 'rgba(0,0,0,0.8)',
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          padding: window.innerWidth < 640 ? 10 : 20
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        grid: {
          color: '#374151'
        }
      }
    },
    backgroundColor: 'rgba(0,0,0,0.8)',
  };

  // Chart options for Engagement Trend with tooltip showing original values
  const engagementTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          padding: window.innerWidth < 640 ? 10 : 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const originalValue = context.dataset.originalData[context.dataIndex];
            const normalizedValue = context.parsed.y.toFixed(1);

            return `Engagement Rate: ${originalValue.toFixed(2)}% (Normalized: ${normalizedValue}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          callback: function(value) {
            return value.toFixed(1);
          }
        },
        grid: {
          color: '#374151'
        },
        title: {
          display: true,
          text: 'Normalized Scale (0-100%)',
          color: '#9CA3AF',
          font: {
            size: 11
          }
        }
      }
    },
    backgroundColor: 'rgba(0,0,0,0.8)',
  };

  // Use centralized normalization function

  const likesData = recentContent.map(item => formatNumber(item.likes));
  const commentsData = recentContent.map(item => formatNumber(item.comments));
  const viewsData = recentContent.map(item => formatNumber(item.views) || 0);

  const normLikes = normalizeData(likesData);
  const normComments = normalizeData(commentsData);
  const normViews = normalizeData(viewsData);

  const likesVsCommentsData = {
    labels: recentContent.map((item) => {
      return new Date(item.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Likes',
        data: normLikes.normalized,
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        originalData: normLikes.original,
      },
      {
        label: 'Comments',
        data: normComments.normalized,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        originalData: normComments.original,
      },
      {
        label: 'Views',
        data: normViews.normalized,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        originalData: normViews.original,
      },
    ],
  };

  // Calculate engagement rates for each post
  const engagementRates = recentContent.map(item => {
    const engagement = calculateEngagementRate(
      formatNumber(item.likes),
      formatNumber(item.comments),
      followers
    );
    return parseFloat(engagement.toFixed(2));
  });

  // Normalize engagement rates for better visualization
  const normEngagementRates = normalizeData(engagementRates);

  const engagementTrendData = {
    labels: recentContent.map((item) => {
      return new Date(item.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Engagement Rate (%)',
        data: normEngagementRates.normalized,
        originalData: normEngagementRates.original, // Store original values for tooltip
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(249, 115, 22, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const postPerformanceData = {
    labels: ['Posts', 'Reels'],
    datasets: [
      {
        data: [posts?.length || 0, reels?.length || 0],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9CA3AF',
          padding: window.innerWidth < 640 ? 10 : 20,
          usePointStyle: true,
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        }
      },
    },
    cutout: '60%',
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <InstagramIcon className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Instagram Analytics Overview</h2>
        </div>
        <p className="text-gray-400">Deep insights into engagement patterns and content performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        <Card className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <InstagramIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Likes vs Comments vs Views</h3>
          </div>
          <div className="h-64 sm:h-80">
            <Bar data={likesVsCommentsData} options={chartOptionsWithTooltip} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <InstagramIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Engagement Trend</h3>
          </div>
          <div className="h-64 sm:h-80">
            <Line data={engagementTrendData} options={engagementTrendOptions} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        <Card className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <InstagramIcon className="w-5 h-5 text-green-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Content Distribution</h3>
          </div>
          <div className="h-48 sm:h-64">
            <Doughnut data={postPerformanceData} options={doughnutOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <InstagramIcon className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Performance Metrics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Best Performing Content</span>
              <span className="text-purple-400 font-semibold">{bestContentType}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Average Engagement Rate</span>
              <span className="text-blue-400 font-semibold">{engagementRate}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Average Reach (Views)</span>
              <span className="text-green-400 font-semibold">{formatDisplayNumber(avgViews)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Total Content</span>
              <span className="text-yellow-400 font-semibold">{allContent.length} posts</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <InstagramIcon className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-white">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">{formatNumber(profile?.engagement_rate || 0)}%</div>
              <div className="text-gray-400 text-sm">Engagement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">{formatNumber(profile?.avg_likes || 0)}</div>
              <div className="text-gray-400 text-sm">Avg Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{formatNumber(profile?.avg_comments || 0)}</div>
              <div className="text-gray-400 text-sm">Avg Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">{reels?.reduce((sum, reel) => sum + (reel.views || 0), 0) || 0}</div>
              <div className="text-gray-400 text-sm">Total Views</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts;