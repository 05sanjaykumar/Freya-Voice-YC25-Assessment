// web/app/console/Components/MetricsPanel.tsx
import { BarChart3 } from 'lucide-react';

export default function MetricsPanel() {
  return (
    <aside className="w-80 bg-white border-l overflow-y-auto">
      <div className="p-6 border-b space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-gray-800">
          <BarChart3 className="w-5 h-5" />
          Performance
        </h2>
        <div className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="text-xs text-blue-600 font-medium">Avg First Token</div>
            <div className="text-2xl font-bold text-blue-700">--ms</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="text-xs text-green-600 font-medium">Tokens/Second</div>
            <div className="text-2xl font-bold text-green-700">--</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl">
            <div className="text-xs text-purple-600 font-medium">Error Rate</div>
            <div className="text-2xl font-bold text-purple-700">--%</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        <h3 className="font-semibold text-gray-800">Activity Log</h3>
        <div className="text-xs text-gray-500">No activity yet</div>
      </div>
    </aside>
  );
}
