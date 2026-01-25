'use client';

import { MetricsChatProvider } from '@/components/features/planner/metrics-chat-provider';
import { MetricsChatPanel } from '@/components/features/planner/metrics-chat-panel';
import { LiveTreePanel } from '@/components/features/planner/live-tree-panel';

export default function PlannerPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <MetricsChatProvider>
        <div className="flex h-full">
          {/* Left Panel - Chat */}
          <div className="w-[45%] min-w-[350px] max-w-[600px] border-r">
            <MetricsChatPanel />
          </div>

          {/* Right Panel - Tree */}
          <div className="flex-1">
            <LiveTreePanel />
          </div>
        </div>
      </MetricsChatProvider>
    </div>
  );
}
