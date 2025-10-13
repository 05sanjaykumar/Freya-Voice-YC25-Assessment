// web/app/console/Components/MetricsPanel.tsx
import { BarChart3, Clock, Zap, AlertCircle } from 'lucide-react';
import { store } from '@/lib/store';
import { useEffect, useState } from 'react';

interface MetricsPanelProps {
  sessionId?: string | null;
}

export default function MetricsPanel({ sessionId }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);

  useEffect(() => {
    // Load global metrics
    const globalMetrics = store.getGlobalMetrics();
    setMetrics(globalMetrics);

    // Load current session
    if (sessionId) {
      const session = store.getSession(sessionId);
      setCurrentSession(session);
    }

    // Refresh every 2 seconds
    const interval = setInterval(() => {
      const refreshedMetrics = store.getGlobalMetrics();
      setMetrics(refreshedMetrics);
      
      if (sessionId) {
        const refreshedSession = store.getSession(sessionId);
        setCurrentSession(refreshedSession);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <aside className="w-80 bg-white border-l overflow-y-auto">
      <div className="p-6 border-b space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-gray-800">
          <BarChart3 className="w-5 h-5" />
          Performance
        </h2>
        
        <div className="space-y-3">
          {/* Avg First Token Latency */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="text-xs text-blue-600 font-medium">Avg First Token</div>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {metrics?.avgFirstTokenLatency > 0 
                ? `${metrics.avgFirstTokenLatency}ms`
                : '--ms'}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {metrics?.avgFirstTokenLatency > 0 ? 'Measured' : 'Waiting for data...'}
            </div>
          </div>

          {/* Tokens/Second */}
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <div className="text-xs text-green-600 font-medium">Tokens/Second</div>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {metrics?.avgTokensPerSec > 0 
                ? metrics.avgTokensPerSec
                : '--'}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {metrics?.avgTokensPerSec > 0 ? 'Measured' : 'Waiting for data...'}
            </div>
          </div>

          {/* Error Rate */}
          <div className="bg-purple-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              <div className="text-xs text-purple-600 font-medium">Error Rate (24h)</div>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {metrics?.errorRate?.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {metrics?.last24hSessions || 0} sessions
            </div>
          </div>
        </div>
      </div>

      {/* Current Session */}
      {currentSession && (
        <div className="p-6 border-b space-y-3">
          <h3 className="font-semibold text-gray-800">Current Session</h3>
          <div className="space-y-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Messages</div>
              <div className="text-xl font-bold text-gray-800">
                {currentSession.messages.length}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Avg Latency</div>
              <div className="text-xl font-bold text-gray-800">
                {currentSession.metrics.avgFirstTokenLatency > 0
                  ? `${currentSession.metrics.avgFirstTokenLatency}ms`
                  : '--'}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Duration</div>
              <div className="text-xl font-bold text-gray-800">
                {Math.round((Date.now() - new Date(currentSession.startedAt).getTime()) / 60000)}m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity */}
      <div className="p-6 space-y-3">
        <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        {metrics && metrics.totalSessions > 0 ? (
          <div className="text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Sessions (24h)</span>
              <span className="font-semibold">{metrics.last24hSessions}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Sessions</span>
              <span className="font-semibold">{metrics.totalSessions}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">No activity yet</div>
        )}
      </div>
    </aside>
  );
}
