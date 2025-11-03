import React, { useState, useEffect } from 'react';
import logger, { LogLevel, LogEntry } from '../utils/logger';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.DEBUG);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLogs = logger.getLogs(filterCategory || undefined, filterLevel);
      setLogs(newLogs.slice(-100)); // Keep only last 100 logs
    }, 1000);

    return () => clearInterval(interval);
  }, [filterLevel, filterCategory]);

  const filteredLogs = logs.filter(log => 
    log.level >= filterLevel && 
    (!filterCategory || log.category.includes(filterCategory.toUpperCase()))
  );

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG: return '#888';
      case LogLevel.INFO: return '#2196F3';
      case LogLevel.WARN: return '#FF9800';
      case LogLevel.ERROR: return '#F44336';
      default: return '#000';
    }
  };

  const getLevelName = (level: LogLevel): string => {
    return LogLevel[level];
  };

  const exportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gomoku-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        backgroundColor: 'white',
        width: '90%',
        height: '90%',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0 }}>Frontend Logs</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={filterLevel} 
              onChange={(e) => setFilterLevel(Number(e.target.value) as LogLevel)}
            >
              <option value={LogLevel.DEBUG}>DEBUG+</option>
              <option value={LogLevel.INFO}>INFO+</option>
              <option value={LogLevel.WARN}>WARN+</option>
              <option value={LogLevel.ERROR}>ERROR</option>
            </select>
            <input
              type="text"
              placeholder="Filter by category..."
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '4px 8px' }}
            />
            <label>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
            <button onClick={exportLogs}>Export</button>
            <button onClick={clearLogs}>Clear</button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>

        {/* Logs */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '8px',
        }}>
          {filteredLogs.map((log, index) => (
            <div key={index} style={{
              marginBottom: '4px',
              padding: '4px',
              borderLeft: `4px solid ${getLevelColor(log.level)}`,
              backgroundColor: log.level >= LogLevel.ERROR ? '#ffebee' : 
                             log.level >= LogLevel.WARN ? '#fff3e0' : 
                             '#f5f5f5',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ 
                  color: getLevelColor(log.level), 
                  fontWeight: 'bold',
                  minWidth: '50px'
                }}>
                  {getLevelName(log.level)}
                </span>
                <span style={{ color: '#666', minWidth: '80px' }}>
                  {log.category}
                </span>
                <span style={{ color: '#999', fontSize: '10px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ flex: 1 }}>
                  {log.message}
                </span>
              </div>
              {log.data && (
                <pre style={{
                  margin: '4px 0 0 66px',
                  fontSize: '10px',
                  color: '#666',
                  overflow: 'auto',
                  maxHeight: '100px',
                }}>
                  {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Global debug component
const LoggerDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        zIndex: 9999,
        userSelect: 'none',
      }} onClick={() => setIsOpen(true)}>
        📊 Logs (Ctrl+Shift+L)
      </div>
      <LogViewer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default LoggerDebugPanel;