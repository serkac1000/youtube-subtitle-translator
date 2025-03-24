import React, { useState, useEffect, useRef } from 'react';
import DebugLogger from './DebugLogger';
import { LogEntry } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface DebugConsoleProps {
  title?: string;
  recognitionStatus?: {
    isListening: boolean;
    language: string;
    cuesCount: number;
  };
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ 
  title = 'Debug Console',
  recognitionStatus
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logger = DebugLogger.getInstance();

  useEffect(() => {
    // Subscribe to logger updates
    const unsubscribe = logger.subscribe((newLogs) => {
      let filtered = newLogs;
      if (filter !== 'all') {
        filtered = newLogs.filter(log => log.type === filter);
      }
      setLogs(filtered);
    });

    // Initial load
    setLogs(logger.getLogs(filter as any));

    return () => {
      unsubscribe();
    };
  }, [filter]);

  useEffect(() => {
    // Auto-scroll if enabled
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setLogs(logger.getLogs(value as any));
  };

  const handleClearLogs = () => {
    logger.clearLogs();
  };

  const handleExportLogs = () => {
    const logText = logger.exportLogs();
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-subtitle-translator-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Colorize log entries based on type
  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-primary-light';
      case 'success': return 'text-green-400';
      case 'debug': return 'text-gray-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Log actions */}
      <div className="bg-gray-800 p-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex space-x-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700 h-8 text-sm">
              <SelectValue placeholder="Filter logs" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-1 text-sm">
            <Checkbox
              id="autoscroll"
              checked={autoScroll}
              onCheckedChange={(checked) => setAutoScroll(checked as boolean)}
              className="rounded bg-gray-900 border-gray-700"
            />
            <label htmlFor="autoscroll" className="ml-1 cursor-pointer">Auto-scroll</label>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearLogs}
            className="bg-gray-900 hover:bg-gray-700 px-2 py-1 rounded text-sm h-8 border-gray-700"
          >
            <span className="material-icons text-sm mr-1">delete_sweep</span>
            <span>Clear</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportLogs}
            className="bg-gray-900 hover:bg-gray-700 px-2 py-1 rounded text-sm h-8 border-gray-700"
          >
            <span className="material-icons text-sm mr-1">file_download</span>
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      {/* Log content */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-auto p-3 font-mono text-sm bg-gray-900"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No logs to display</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry mb-1 pb-1 border-b border-gray-800">
              <span className="text-gray-500">[{log.timestamp}]</span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
      
      {/* Real-time status display */}
      {recognitionStatus && (
        <div className="bg-gray-800 p-3 border-t border-gray-700">
          <div className="flex items-center text-sm">
            <span className={`material-icons text-sm mr-2 ${recognitionStatus.isListening ? 'text-green-400' : 'text-yellow-400'}`}>
              {recognitionStatus.isListening ? 'mic' : 'warning'}
            </span>
            <span className="font-mono">
              Current recognition status: {recognitionStatus.isListening ? 'active' : 'inactive'}, 
              language: {recognitionStatus.language}, 
              cues: {recognitionStatus.cuesCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugConsole;
