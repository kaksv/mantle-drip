Failed to export: generateStreamsPDF is not defined
# Dashboard Streams Analytics & Export - Implementation Plan

## Overview
Enhance the Dashboard tab on the Treasury page with comprehensive stream analytics, interactive charts/graphs, detailed stream data tables, and integrated CSV export functionality.

---

## Current State

### Dashboard Tab Currently Has:
- Treasury Overview Cards (active streams, subscriptions, payments)
- Token Balances
- Financial Analytics (outflow projections, average amounts)

### What We're Adding:
- **Streams Analytics Dashboard** with:
  - Interactive charts and graphs
  - Detailed stream data table
  - Stream status breakdown
  - Recipient analytics
  - Time-based analytics
  - CSV export functionality

---

## Implementation Phases

### Phase 1: Data Aggregation & Hooks
**Goal**: Create hooks and utilities to aggregate detailed stream data for analytics

**Tasks**:
1. Create `apps/web/src/lib/hooks/useStreamAnalytics.ts`
   - Aggregate all stream data with recipient details
   - Calculate metrics: total deposits, distributions, withdrawals
   - Group by status, token, time periods
   - Calculate trends and projections

2. Create `apps/web/src/lib/utils/stream-analytics.ts`
   - Helper functions for analytics calculations
   - Time-based aggregations (daily, weekly, monthly)
   - Status breakdown calculations
   - Token-based aggregations

3. Enhance `useTreasury` hook (if needed)
   - Add detailed stream recipient data fetching
   - Add historical data tracking

**Deliverables**:
- ✅ `useStreamAnalytics` hook
- ✅ Analytics calculation utilities
- ✅ Type definitions for analytics data

**Estimated Time**: 3-4 hours

---

### Phase 2: Chart Library Integration
**Goal**: Set up charting library and create base chart components

**Tasks**:
1. Install charting library (Recharts recommended - React-friendly, free)
   ```bash
   cd apps/web
   pnpm add recharts
   ```

2. Create base chart components:
   - `apps/web/src/components/charts/LineChart.tsx` - For trends over time
   - `apps/web/src/components/charts/BarChart.tsx` - For comparisons
   - `apps/web/src/components/charts/PieChart.tsx` - For distributions
   - `apps/web/src/components/charts/AreaChart.tsx` - For cumulative data

3. Create chart wrapper component:
   - `apps/web/src/components/charts/ChartCard.tsx` - Reusable card wrapper for charts

**Deliverables**:
- ✅ Chart library installed
- ✅ Base chart components
- ✅ Chart wrapper component

**Estimated Time**: 2-3 hours

---

### Phase 3: Stream Analytics Dashboard Component
**Goal**: Create comprehensive dashboard component with all analytics

**Tasks**:
1. Create `apps/web/src/components/streams-analytics-dashboard.tsx`
   - Main dashboard component
   - Grid layout for charts and data
   - Responsive design

2. Create chart sections:
   - **Stream Status Distribution** (Pie Chart)
     - Active, Paused, Completed, Cancelled breakdown
   - **Total Deposits by Token** (Bar Chart)
     - Compare deposits across different tokens
   - **Outflow Over Time** (Line/Area Chart)
     - Daily/weekly/monthly outflow trends
   - **Recipients Distribution** (Bar Chart)
     - Number of recipients per stream
     - Total recipients across all streams
   - **Withdrawal Activity** (Line Chart)
     - Withdrawals over time
   - **Token Distribution** (Pie Chart)
     - Percentage of streams by token type

3. Create data table section:
   - `apps/web/src/components/streams-data-table.tsx`
   - Sortable, filterable table
   - Columns: ID, Title, Status, Token, Deposit, Recipients, Start/End, Actions
   - Pagination for large datasets
   - Row expansion for detailed view

**Deliverables**:
- ✅ Streams Analytics Dashboard component
- ✅ All chart sections
- ✅ Streams data table component

**Estimated Time**: 5-6 hours

---

### Phase 4: Enhanced CSV Export Integration
**Goal**: Integrate comprehensive CSV export with all stream and recipient data

**Tasks**:
1. Enhance `stream-export.ts` utilities:
   - Add `prepareAllStreamsForExport()` function
   - Add `generateAllStreamsCSV()` function
   - Include recipient data for each stream
   - Add summary statistics section

2. Create export handler in dashboard:
   - Export all streams with full recipient details
   - Include analytics summary
   - Generate comprehensive CSV with multiple sections

3. Add export button to dashboard:
   - Prominent export button in dashboard header
   - Export options: All Streams, Active Only, By Token, etc.

**Deliverables**:
- ✅ Enhanced export utilities
- ✅ Export handler in dashboard
- ✅ Export button with options

**Estimated Time**: 2-3 hours

---

### Phase 5: Interactive Features & Filters
**Goal**: Add filtering, sorting, and interactive features

**Tasks**:
1. Add filter controls:
   - Filter by status (Active, Paused, Completed, etc.)
   - Filter by token
   - Filter by date range
   - Search by stream title/ID

2. Add time range selector:
   - Last 7 days, 30 days, 90 days, All time
   - Custom date range picker

3. Add chart interactivity:
   - Tooltips with detailed data
   - Click to filter streams by chart segment
   - Zoom/pan for time-based charts

4. Add data refresh controls:
   - Manual refresh button
   - Auto-refresh toggle
   - Loading states

**Deliverables**:
- ✅ Filter controls
- ✅ Time range selector
- ✅ Interactive charts
- ✅ Refresh controls

**Estimated Time**: 3-4 hours

---

### Phase 6: UI/UX Polish & Responsive Design
**Goal**: Polish the UI and ensure responsive design

**Tasks**:
1. Responsive layout:
   - Mobile-friendly chart sizing
   - Stack charts on small screens
   - Responsive table with horizontal scroll

2. Loading states:
   - Skeleton loaders for charts
   - Loading indicators
   - Empty states

3. Error handling:
   - Error boundaries
   - Error messages
   - Fallback UI

4. Performance optimization:
   - Memoization for expensive calculations
   - Virtual scrolling for large tables
   - Chart data caching

**Deliverables**:
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling
- ✅ Performance optimizations

**Estimated Time**: 2-3 hours

---

## Component Structure

```
apps/web/src/
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── AreaChart.tsx
│   │   └── ChartCard.tsx
│   ├── streams-analytics-dashboard.tsx
│   ├── streams-data-table.tsx
│   └── stream-analytics-filters.tsx
├── lib/
│   ├── hooks/
│   │   └── useStreamAnalytics.ts
│   └── utils/
│       └── stream-analytics.ts
```

---

## Data Structure

### Stream Analytics Data
```typescript
interface StreamAnalytics {
  summary: {
    totalStreams: number;
    activeStreams: number;
    pausedStreams: number;
    completedStreams: number;
    cancelledStreams: number;
    totalDeposit: Record<string, bigint>; // by token
    totalDistributed: Record<string, bigint>;
    totalRecipients: number;
    avgRecipientsPerStream: number;
  };
  byStatus: {
    active: StreamData[];
    paused: StreamData[];
    completed: StreamData[];
    cancelled: StreamData[];
  };
  byToken: Record<string, StreamData[]>;
  byTimePeriod: {
    daily: TimePeriodData[];
    weekly: TimePeriodData[];
    monthly: TimePeriodData[];
  };
  recipientStats: {
    totalRecipients: number;
    uniqueRecipients: number;
    avgRecipientsPerStream: number;
    topRecipients: RecipientStats[];
  };
  withdrawalStats: {
    totalWithdrawn: Record<string, bigint>;
    withdrawalsOverTime: WithdrawalData[];
    avgWithdrawalAmount: Record<string, number>;
  };
}
```

---

## Charts to Implement

### 1. Stream Status Distribution (Pie Chart)
- **Data**: Count of streams by status
- **Colors**: Green (Active), Yellow (Paused), Blue (Completed), Gray (Cancelled)
- **Tooltip**: Show count and percentage

### 2. Total Deposits by Token (Bar Chart)
- **Data**: Sum of deposits grouped by token
- **X-axis**: Token symbols
- **Y-axis**: Deposit amounts
- **Tooltip**: Show exact amount and number of streams

### 3. Outflow Over Time (Area/Line Chart)
- **Data**: Daily/weekly/monthly outflow projections
- **X-axis**: Time periods
- **Y-axis**: Outflow amount
- **Multiple lines**: One per token
- **Tooltip**: Show amount per token for selected period

### 4. Recipients Distribution (Bar Chart)
- **Data**: Number of recipients per stream
- **X-axis**: Stream IDs or titles
- **Y-axis**: Number of recipients
- **Tooltip**: Show stream details and recipient list

### 5. Withdrawal Activity (Line Chart)
- **Data**: Withdrawals over time
- **X-axis**: Time periods
- **Y-axis**: Withdrawal amounts
- **Multiple lines**: One per token
- **Tooltip**: Show withdrawal details

### 6. Token Distribution (Pie Chart)
- **Data**: Percentage of streams using each token
- **Colors**: Different color per token
- **Tooltip**: Show count and percentage

### 7. Stream Duration Distribution (Bar Chart)
- **Data**: Streams grouped by duration ranges
- **X-axis**: Duration ranges (0-1 day, 1-7 days, 1-4 weeks, 1-12 months, 1+ years)
- **Y-axis**: Number of streams
- **Tooltip**: Show stream count and average deposit

---

## Streams Data Table

### Columns:
1. **Stream ID** - Clickable link to stream details
2. **Title** - Stream title (truncated if long)
3. **Status** - Badge with color coding
4. **Token** - Token symbol with icon
5. **Total Deposit** - Formatted amount
6. **Recipients** - Count with expandable list
7. **Start Date** - Formatted date
8. **End Date** - Formatted date
9. **Time Remaining** - For active streams
10. **Actions** - View details, Export, etc.

### Features:
- Sortable columns
- Filterable by status, token, date range
- Search by title/ID
- Pagination (20/50/100 per page)
- Row expansion for detailed recipient info
- Bulk selection for bulk operations
- Export selected streams

---

## CSV Export Structure

### Enhanced CSV Format:
```csv
Treasury Streams Export
Exported At: 2025-12-06 02:09:11 UTC
Exported By: 0x7818CEd1298849B47a9B56066b5adc72CDDAf733
Network: Celo Mainnet

Summary Statistics
Total Streams,18
Active Streams,12
Paused Streams,2
Completed Streams,3
Cancelled Streams,1
Total Recipients,25
Average Recipients Per Stream,1.39
Total Deposits (cUSD),150.5
Total Distributed (cUSD),45.2
Total Available to Withdraw (cUSD),12.8

Streams Data
Stream ID,Title,Status,Token,Total Deposit,Recipients Count,Start Time,End Time,Time Remaining,Total Distributed,Available to Withdraw
18,Monthly Payments,Active,cUSD,4.975,1,2025-12-06 02:07:15,2025-12-06 03:07:15,58 minutes,0.161111,0.161111
...

Recipients Data
Stream ID,Recipient Address,Rate Per Second,Rate Per Hour,Rate Per Day,Total Withdrawn,Current Available,Total Received,Last Withdrawal Time,% of Deposit,% of Distributed
18,0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7,0.001388888888888889 cUSD/sec,5.0 cUSD/hr,120.0 cUSD/day,0.0 cUSD,0.161111 cUSD,0.161111 cUSD,Never,3.24%,100.00%
...

Analytics Summary
Status Distribution
Active,12,66.67%
Paused,2,11.11%
Completed,3,16.67%
Cancelled,1,5.56%

Token Distribution
cUSD,10,55.56%
USDC,5,27.78%
CELO,3,16.67%
```

---

## Dependencies

### New Dependencies:
```json
{
  "recharts": "^2.10.3"  // For charts
}
```

### Optional (for advanced features):
```json
{
  "@tanstack/react-table": "^8.0.0"  // For advanced table features
}
```

---

## Success Criteria

1. ✅ Dashboard shows all stream data in organized sections
2. ✅ Charts display accurate analytics data
3. ✅ Charts are interactive (tooltips, filtering)
4. ✅ Data table is sortable, filterable, and searchable
5. ✅ CSV export includes all stream and recipient data
6. ✅ Export works for all streams or filtered selection
7. ✅ Responsive design works on mobile and desktop
8. ✅ Loading states and error handling work correctly
9. ✅ Performance is acceptable with large datasets
10. ✅ UI matches existing design system

---

## Estimated Total Time

- **Phase 1**: 3-4 hours
- **Phase 2**: 2-3 hours
- **Phase 3**: 5-6 hours
- **Phase 4**: 2-3 hours
- **Phase 5**: 3-4 hours
- **Phase 6**: 2-3 hours

**Total**: 17-23 hours

---

## Risk Assessment

### Low Risk:
- Chart library integration (Recharts is well-maintained)
- CSV export (already have utilities)
- Data aggregation (straightforward calculations)

### Medium Risk:
- Performance with large datasets (mitigate with pagination, virtualization)
- Chart rendering performance (mitigate with data sampling for large datasets)

### Mitigation Strategies:
- Implement pagination for data table
- Use virtual scrolling for large lists
- Sample data for charts if dataset is very large (>1000 streams)
- Implement debouncing for filters
- Cache calculated analytics data

---

## Next Steps

1. Review and approve this implementation plan
2. Install charting library (Recharts)
3. Start with Phase 1 (Data Aggregation)
4. Build incrementally, testing each phase
5. Get feedback and iterate

---

## Future Enhancements (Post-MVP)

1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Filters**: Save filter presets
3. **Custom Dashboards**: User-configurable chart layouts
4. **Export Templates**: Pre-defined export formats
5. **Scheduled Exports**: Automatic CSV generation
6. **PDF Reports**: Generate PDF reports with charts
7. **Email Reports**: Send analytics reports via email
8. **Comparison Views**: Compare different time periods
9. **Forecasting**: ML-based outflow predictions
10. **Alerts**: Set up alerts for thresholds





