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

const AnalyticsCharts = ({ analytics }) => {
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF'
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      }
    },
    backgroundColor: 'rgba(0,0,0,0.8)',
  };

  const likesVsCommentsData = {
    labels: analytics.likesVsComments.labels,
    datasets: [
      {
        label: 'Likes',
        data: analytics.likesVsComments.likes,
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
      },
      {
        label: 'Comments',
        data: analytics.likesVsComments.comments,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Views',
        data: analytics.likesVsComments.views,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
    ],
  };

  const engagementTrendData = {
    labels: analytics.engagementTrend.labels,
    datasets: [
      {
        label: 'Engagement Rate (%)',
        data: analytics.engagementTrend.engagement,
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
    labels: analytics.postPerformance.labels,
    datasets: [
      {
        data: analytics.postPerformance.data,
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9CA3AF',
          padding: 20,
          usePointStyle: true,
        }
      },
    },
    cutout: '60%',
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Analytics Overview</h2>
        <p className="text-gray-400">Deep insights into engagement patterns and content performance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Likes vs Comments vs Views</h3>
          <div className="h-80">
            <Bar data={likesVsCommentsData} options={chartOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Engagement Trend</h3>
          <div className="h-80">
            <Line data={engagementTrendData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Content Distribution</h3>
          <div className="h-64">
            <Doughnut data={postPerformanceData} options={doughnutOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Performance Metrics</h3>
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
          <h3 className="text-xl font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">4.8%</div>
              <div className="text-gray-400 text-sm">Engagement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">2.3K</div>
              <div className="text-gray-400 text-sm">Avg Likes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">89</div>
              <div className="text-gray-400 text-sm">Avg Comments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">15.2K</div>
              <div className="text-gray-400 text-sm">Avg Views</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts;