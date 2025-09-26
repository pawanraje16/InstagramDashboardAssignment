import { Doughnut, Bar } from 'react-chartjs-2';
import { UserGroupIcon, ClockIcon, MapPinIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Card from './ui/Card';

const AudienceAnalytics = ({ audienceData }) => {
  const chartOptions = {
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

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
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
  };

  const ageGroupsData = {
    labels: audienceData.demographics.ageGroups.labels,
    datasets: [
      {
        data: audienceData.demographics.ageGroups.data,
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const genderData = {
    labels: audienceData.demographics.gender.labels,
    datasets: [
      {
        data: audienceData.demographics.gender.data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const locationData = {
    labels: audienceData.demographics.topLocations.map(loc => loc.country),
    datasets: [
      {
        label: 'Percentage',
        data: audienceData.demographics.topLocations.map(loc => loc.percentage),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Audience Intelligence</h2>
        <p className="text-gray-400">Deep insights into your follower demographics and behavior patterns</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <Card className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <UserGroupIcon className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Age Distribution</h3>
          </div>
          <div className="h-64">
            <Doughnut data={ageGroupsData} options={chartOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <UserGroupIcon className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Gender Split</h3>
          </div>
          <div className="h-64">
            <Doughnut data={genderData} options={chartOptions} />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <ChartBarIcon className="h-6 w-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Engagement Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {audienceData.engagement.avgSessionDuration}
              </div>
              <div className="text-gray-400 text-sm">Avg Session Duration</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="text-2xl font-bold text-purple-400 mb-2">
                {audienceData.engagement.mostActiveDay}
              </div>
              <div className="text-gray-400 text-sm">Most Active Day</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="text-lg font-bold text-blue-400 mb-2">
                {audienceData.engagement.bestPostTimes.join(', ')}
              </div>
              <div className="text-gray-400 text-sm">Best Posting Times</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <MapPinIcon className="h-6 w-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">Top Locations</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-64">
            <Bar data={locationData} options={barChartOptions} />
          </div>

          <div className="space-y-3">
            {audienceData.demographics.topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-purple-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-green-500' :
                    index === 3 ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-white font-medium">{location.country}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-purple-500' :
                        index === 1 ? 'bg-blue-500' :
                        index === 2 ? 'bg-green-500' :
                        index === 3 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-300 font-semibold min-w-[40px]">
                    {location.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <ClockIcon className="h-8 w-8 text-purple-400 mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">4.2M</div>
          <div className="text-gray-400 text-sm">Total Reach</div>
        </Card>

        <Card className="text-center">
          <UserGroupIcon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">85%</div>
          <div className="text-gray-400 text-sm">Audience Retention</div>
        </Card>

        <Card className="text-center">
          <ChartBarIcon className="h-8 w-8 text-green-400 mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">+23%</div>
          <div className="text-gray-400 text-sm">Growth Rate</div>
        </Card>

        <Card className="text-center">
          <MapPinIcon className="h-8 w-8 text-orange-400 mx-auto mb-4" />
          <div className="text-2xl font-bold text-white mb-2">47</div>
          <div className="text-gray-400 text-sm">Countries Reached</div>
        </Card>
      </div>
    </div>
  );
};

export default AudienceAnalytics;