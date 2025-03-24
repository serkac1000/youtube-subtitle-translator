import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from './DebugLogger';

interface DebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel>('info');
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [search, setSearch] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Update logs when the component mounts and when new logs are added
  useEffect(() => {
    // Get initial logs
    setLogs(logger.getLogs(filter));
    
    // Add listener for new logs
    const logListener = (entry: LogEntry) => {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, entry];
        // Only keep the last 1000 logs to prevent memory issues
        if (newLogs.length > 1000) {
          return newLogs.slice(newLogs.length - 1000);
        }
        return newLogs;
      });
    };
    
    logger.addListener(logListener);
    
    return () => {
      logger.removeListener(logListener);
    };
  }, []);
  
  // Filter logs when filter changes
  useEffect(() => {
    setLogs(logger.getLogs(filter));
  }, [filter]);
  
  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (isAutoScrollEnabled && logContainerRef.current && isOpen) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen, isAutoScrollEnabled]);
  
  // Handle clear logs
  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };
  
  // Filter logs by search term
  const filteredLogs = search
    ? logs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.category.toLowerCase().includes(search.toLowerCase())
      )
    : logs;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl h-3/4 rounded-lg shadow-lg flex flex-col">
        <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Debug Console</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm">
              Min Level:
              <select 
                className="ml-2 rounded text-sm border px-1"
                value={filter}
                onChange={(e) => setFilter(e.target.value as LogLevel)}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </label>
            <input 
              type="text"
              placeholder="Search logs..."
              className="border rounded px-2 py-1 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className="text-sm flex items-center">
              <input 
                type="checkbox" 
                checked={isAutoScrollEnabled}
                onChange={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                className="mr-1"
              />
              Auto-scroll
            </label>
            <button 
              className="bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded text-sm"
              onClick={handleClearLogs}
            >
              Clear
            </button>
            <button 
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-auto p-2 font-mono text-sm bg-gray-50"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 flex items-center justify-center h-full">
              No logs to display
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="p-1 text-left w-36">Time</th>
                  <th className="p-1 text-left w-16">Level</th>
                  <th className="p-1 text-left w-28">Category</th>
                  <th className="p-1 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr 
                    key={index} 
                    className={`border-b hover:bg-gray-100 ${
                      log.level === 'error' ? 'bg-red-50' :
                      log.level === 'warn' ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="p-1 text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-1">
                      <span className={`px-1 py-0.5 rounded-sm text-xs ${
                        log.level === 'error' ? 'bg-red-100 text-red-700' :
                        log.level === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                        log.level === 'info' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="p-1 font-semibold">{log.category}</td>
                    <td className="p-1">
                      {log.message}
                      {log.data && (
                        <div className="text-xs text-gray-600 mt-1">
                          {typeof log.data === 'object'
                            ? JSON.stringify(log.data, null, 2)
                            : String(log.data)
                          }
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-2 border-t bg-gray-100 text-sm text-gray-600">
          Total logs: {logs.length} | Displayed: {filteredLogs.length}
          
          <div className="mt-1 text-xs">
            <strong>Speech Recognition Status:</strong>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Active and monitoring
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;