# Frontend Logging System

## Overview
A comprehensive logging system has been implemented in the Gomoku frontend to track all API requests, page navigations, WebSocket communications, and user interactions.

## Features Implemented

### 1. Centralized Logger (`/src/utils/logger.ts`)
- Configurable log levels (DEBUG, INFO, WARN, ERROR)
- Session tracking
- Log buffering with configurable size limits
- Specialized logging methods for different categories
- Export functionality for debugging

### 2. API Request/Response Logging
- All HTTP requests are logged with method, URL, and request data
- Response times are tracked
- Error responses are logged with details
- Authentication events are tracked

### 3. Navigation Logging
- Page transitions are tracked
- Time spent on each page is recorded
- Route changes with parameters are logged

### 4. WebSocket Logging
- Connection attempts and status changes
- All sent and received messages
- Reconnection attempts
- Error conditions

### 5. Component Interaction Logging
- User actions (button clicks, form submissions)
- Component mount/unmount events
- State changes in critical components

### 6. Visual Debug Panel (Development Only)
- Real-time log viewing
- Filtering by log level and category
- Export logs to JSON file
- Accessible via Ctrl+Shift+L or the floating button

## Configuration

### Environment Variables (`.env`)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_LOG_LEVEL=DEBUG  # DEBUG, INFO, WARN, ERROR
```

### Log Levels
- **DEBUG**: Development information, verbose output
- **INFO**: General information, user actions
- **WARN**: Warning conditions, recoverable errors
- **ERROR**: Error conditions, failures

## Usage Examples

### Manual Logging in Components
```typescript
import logger from '../utils/logger';

// Log user actions
logger.userAction('BUTTON_CLICKED', 'ComponentName', { buttonId: 'submit' });

// Log component lifecycle
logger.componentMount('ComponentName', props);
logger.componentUnmount('ComponentName');

// Log state changes
logger.stateChange('ComponentName', oldState, newState);

// Log errors
logger.error('COMPONENT', 'Something went wrong', { error: errorObject });
```

### Accessing Logs Programmatically
```typescript
// Get all logs
const allLogs = logger.getLogs();

// Get logs by category
const apiLogs = logger.getLogs('API_REQUEST');

// Get logs by level
const errorLogs = logger.getLogs(undefined, LogLevel.ERROR);

// Export logs
const jsonLogs = logger.exportLogs();

// Clear logs
logger.clearLogs();
```

## Categories Used

- **APP**: Application lifecycle events
- **AUTH**: Authentication and authorization
- **AUTH_CONTEXT**: Authentication context state changes
- **API_REQUEST**: HTTP request initiation
- **API_RESPONSE**: HTTP response handling
- **API_ERROR**: HTTP request/network errors
- **NAVIGATION**: Page and route changes
- **PAGE**: Page-specific events
- **COMPONENT**: Component lifecycle events
- **USER_ACTION**: User interactions
- **STATE_CHANGE**: State modifications
- **WEBSOCKET**: WebSocket communications
- **GAME**: Game-specific events
- **GAME_BOARD**: Game board interactions
- **LOBBY**: Lobby-related events
- **LOGIN_PAGE**: Login page events

## Development Tools

### Debug Panel
- Access with `Ctrl+Shift+L` or click the floating "📊 Logs" button
- Filter logs by level and category
- Real-time updates
- Export functionality
- Clear logs option

### Browser Console
All logs are also output to the browser console with proper formatting and colors.

## Production Considerations

1. **Log Level**: Set `REACT_APP_LOG_LEVEL=WARN` or `ERROR` in production
2. **Debug Panel**: Automatically disabled in production builds
3. **Performance**: Log buffer is limited to 1000 entries to prevent memory issues
4. **Privacy**: Avoid logging sensitive user data (passwords, tokens, etc.)

## Monitoring Categories

### Critical Events to Monitor
- Authentication failures (`AUTH` category, ERROR level)
- API errors (`API_ERROR` category)
- WebSocket connection issues (`WEBSOCKET` category, ERROR level)
- Game-breaking errors (`GAME` category, ERROR level)

### Performance Metrics
- API response times (available in `API_RESPONSE` logs)
- Page load times (available in `PAGE` logs)
- WebSocket message frequency

## Troubleshooting

### Common Issues
1. **Logs not appearing**: Check `REACT_APP_LOG_LEVEL` setting
2. **Debug panel not opening**: Ensure you're in development mode
3. **Performance issues**: Reduce log level or clear logs frequently

### Debug Steps
1. Open debug panel (Ctrl+Shift+L)
2. Filter by relevant category
3. Look for ERROR level messages
4. Export logs for detailed analysis
5. Check browser console for additional details

## Integration Points

The logging system is integrated into:
- API service (`/src/services/api.ts`)
- Navigation hooks (`/src/hooks/useNavigationLogger.ts`)
- WebSocket hooks (`/src/hooks/useGameWebSocket.ts`)
- Authentication context (`/src/contexts/AuthContext.tsx`)
- Key components (GameBoard, Login, Home, etc.)
- Main App component (`/src/App.tsx`)

This comprehensive logging system provides full visibility into the frontend application's behavior, making debugging and monitoring much more effective.