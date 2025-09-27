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
  // Process real data to create analytics
  const formatNumber = (num) => {
    if (!num && num !== 0) return 0;
    return num;
  };

  // Get recent 10 posts/reels for charts
  const recentContent = [...(posts || []), ...(reels || [])]
    .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))
    .slice(0, 10);

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

  const likesVsCommentsData = {
    labels: recentContent.map((item, idx) => `Content ${idx + 1}`),
    datasets: [
      {
        label: 'Likes',
        data: recentContent.map(item => formatNumber(item.likes)),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
      },
      {
        label: 'Comments',
        data: recentContent.map(item => formatNumber(item.comments)),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Views',
        data: recentContent.map(item => formatNumber(item.views) || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
    ],
  };

  const engagementTrendData = {
    labels: recentContent.map((item, idx) => `Content ${idx + 1}`),
    datasets: [
      {
        label: 'Engagement Rate (%)',
        data: recentContent.map(item => {
          const engagement = ((formatNumber(item.likes) + formatNumber(item.comments)) / Math.max(formatNumber(item.views) || formatNumber(item.likes), 1)) * 100;
          return parseFloat(engagement.toFixed(2));
        }),
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Analytics Overview</h2>
        <p className="text-gray-400">Deep insights into engagement patterns and content performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        <Card className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Likes vs Comments vs Views</h3>
          <div className="h-64 sm:h-80">
            <Bar data={likesVsCommentsData} options={chartOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Engagement Trend</h3>
          <div className="h-64 sm:h-80">
            <Line data={engagementTrendData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        <Card className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Content Distribution</h3>
          <div className="h-48 sm:h-64">
            <Doughnut data={postPerformanceData} options={doughnutOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Best Performing Content</span>
              <span className="text-purple-400 font-semibold">Reels</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Peak Engagement Time</span>
              <span className="text-blue-400 font-semibold">6-9 PM</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Average Reach</span>
              <span className="text-green-400 font-semibold">45.2K</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl">
              <span className="text-gray-400">Growth Rate</span>
              <span className="text-yellow-400 font-semibold">+12.5%</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Quick Stats</h3>
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