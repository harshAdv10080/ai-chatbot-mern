import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Clock, 
  TrendingUp,
  Upload,
  Bot,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI, uploadAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    conversations: 0,
    documents: 0,
    tokensUsed: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load conversations and documents in parallel
      const [conversationsRes, documentsRes] = await Promise.all([
        chatAPI.getConversations({ limit: 5 }),
        uploadAPI.getDocuments({ limit: 5 })
      ]);

      setStats({
        conversations: conversationsRes.data.pagination.total,
        documents: documentsRes.data.pagination.total,
        tokensUsed: user?.subscription?.tokensUsed || 0,
        recentActivity: [
          ...conversationsRes.data.conversations.map(conv => ({
            type: 'conversation',
            title: conv.title,
            date: conv.lastActivity,
            id: conv.id
          })),
          ...documentsRes.data.documents.map(doc => ({
            type: 'document',
            title: doc.filename,
            date: doc.uploadedAt,
            id: doc.id
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTokenUsagePercentage = () => {
    if (!user?.subscription) return 0;
    return Math.round((user.subscription.tokensUsed / user.subscription.tokensLimit) * 100);
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {user?.name}
              </p>
            </div>
            <Link
              to="/chat"
              className="btn-primary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chatting
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Conversations */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Conversations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.conversations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Documents
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.documents}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Tokens Used */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Tokens Used
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.tokensUsed.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Usage Percentage */}
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Usage
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {getTokenUsagePercentage()}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'conversation' ? (
                          <MessageSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/chat"
                  className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bot className="w-8 h-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    New Chat
                  </span>
                </Link>

                <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Upload Doc
                  </span>
                </button>

                <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <BarChart3 className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Analytics
                  </span>
                </button>

                <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Users className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Token Usage Chart */}
        <div className="mt-8 card">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Token Usage
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user?.subscription?.tokensUsed || 0} / {user?.subscription?.tokensLimit || 0} tokens used
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {getTokenUsagePercentage()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  getTokenUsagePercentage() > 80 
                    ? 'bg-red-600' 
                    : getTokenUsagePercentage() > 60 
                    ? 'bg-yellow-600' 
                    : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(getTokenUsagePercentage(), 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Resets on {new Date(user?.subscription?.resetDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
