# CSV Export Feature - Implementation Plan

## Overview
Add an export feature to the stream details page that allows stream owners to export stream details and recipient data in CSV format for accounting, reconciliation, and reporting purposes.

---

## Data to Export

### Stream Details Section
- Stream ID
- Title
- Description
- Sender Address
- Token Symbol
- Token Address
- Total Deposit (formatted)
- Start Time (formatted date)
- End Time (formatted date)
- Status (Active/Paused/Completed/Cancelled)
- Created Date (if available)
- Contract Address
- Explorer URL

### Analytics Section
- Total Deposit
- Total Distributed
- Total Available to Withdraw
- Remaining Deposit
- Stream Duration (days/hours)
- Time Elapsed
- Time Remaining (if active)

### Recipients Section (One row per recipient)
- Recipient Address
- Rate Per Second (formatted)
- Rate Per Hour (calculated)
- Rate Per Day (calculated)
- Total Withdrawn (formatted)
- Current Available Balance (formatted)
- Total Received (withdrawn + available)
- Last Withdrawal Time (formatted date, or "Never")
- Percentage of Total Deposit (calculated)
- Percentage of Total Distributed (calculated)

---

## Implementation Phases

### Phase 1: Core CSV Utility Functions
**Goal**: Create reusable CSV generation utilities

**Tasks**:
1. Create `apps/web/src/lib/utils/csv-export.ts` utility file
   - `convertToCSV(data: any[], headers: string[]): string` - Convert array of objects to CSV string
   - `downloadCSV(csvContent: string, filename: string): void` - Trigger browser download
   - `formatDate(timestamp: number): string` - Format Unix timestamp to readable date
   - `formatAddress(address: string): string` - Format address for CSV (full or truncated)
   - `escapeCSVValue(value: any): string` - Escape special characters in CSV values

2. Create `apps/web/src/lib/utils/stream-export.ts` utility file
   - `prepareStreamDataForExport(streamData, recipientsInfo, analytics, tokenInfo): StreamExportData` - Prepare all stream data for export
   - `generateStreamCSV(exportData: StreamExportData): string` - Generate complete CSV content
   - `calculateRecipientMetrics(recipient, streamData, tokenDecimals): RecipientMetrics` - Calculate derived metrics

**Deliverables**:
- ✅ CSV utility functions
- ✅ Stream data preparation functions
- ✅ Type definitions for export data

**Estimated Time**: 2-3 hours

---

### Phase 2: Export Button UI Component
**Goal**: Add export button to stream details page (visible only to stream owner)

**Tasks**:
1. Add export button to `stream-details-view.tsx`
   - Place in stream header section (next to status badges)
   - Only visible when `isUserSender === true`
   - Use Download icon (already imported)
   - Add loading state during export generation

2. Create export handler function
   - `handleExportStream()` - Main export handler
   - Validate data availability
   - Show loading toast
   - Generate CSV
   - Trigger download
   - Show success/error toast

**Deliverables**:
- ✅ Export button in UI
- ✅ Export handler function
- ✅ Loading and error states

**Estimated Time**: 1-2 hours

---

### Phase 3: CSV Generation Logic
**Goal**: Implement complete CSV generation with all stream and recipient data

**Tasks**:
1. Implement CSV structure:
   ```
   Section 1: Stream Information
   - Header row with stream metadata
   - Key-value pairs for stream details
   
   Section 2: Analytics Summary
   - Header row
   - Key-value pairs for analytics
   
   Section 3: Recipients Data
   - Header row with recipient columns
   - One row per recipient with all metrics
   ```

2. Format all data appropriately:
   - Dates: ISO format or readable format (configurable)
   - Numbers: Human-readable with token symbol
   - Addresses: Full addresses (for CSV export)
   - Percentages: Calculated and formatted
   - Status: Human-readable text

3. Handle edge cases:
   - Missing data (null/undefined)
   - Empty recipient list
   - Very large numbers
   - Special characters in titles/descriptions

**Deliverables**:
- ✅ Complete CSV generation
- ✅ Proper formatting for all data types
- ✅ Edge case handling

**Estimated Time**: 3-4 hours

---

### Phase 4: Enhanced Features & Polish
**Goal**: Add additional features and improve user experience

**Tasks**:
1. Add export options (optional):
   - Date format preference (ISO vs readable)
   - Include/exclude specific sections
   - Address format (full vs truncated)

2. Add filename generation:
   - Format: `drip-stream-{streamId}-{date}.csv`
   - Example: `drip-stream-18-2025-12-06.csv`

3. Add export metadata:
   - Export timestamp
   - Exported by (address)
   - Network/chain information
   - Contract version (if available)

4. Improve error handling:
   - Clear error messages
   - Fallback for missing data
   - Validation before export

5. Add export preview (optional)
   - Show data summary before export
   - Allow user to review what will be exported

**Deliverables**:
- ✅ Enhanced export features
- ✅ Better error handling
- ✅ Professional filename format
- ✅ Export metadata

**Estimated Time**: 2-3 hours

---

### Phase 5: Testing & Documentation
**Goal**: Test thoroughly and document the feature

**Tasks**:
1. Test scenarios:
   - Export with single recipient
   - Export with multiple recipients
   - Export with no recipients (edge case)
   - Export with different stream statuses
   - Export with different tokens (CELO, cUSD, USDC)
   - Export with very long titles/descriptions
   - Export with special characters
   - Test on different browsers (Chrome, Firefox, Safari)

2. Verify CSV format:
   - Open in Excel/Google Sheets
   - Verify all columns are correct
   - Verify data formatting
   - Verify special characters are handled

3. Documentation:
   - Add JSDoc comments to utility functions
   - Update README if needed
   - Add usage examples

**Deliverables**:
- ✅ Comprehensive testing
- ✅ Documentation
- ✅ Bug fixes

**Estimated Time**: 2-3 hours

---

## Technical Implementation Details

### File Structure
```
apps/web/src/
├── lib/
│   └── utils/
│       ├── csv-export.ts          # Core CSV utilities
│       └── stream-export.ts       # Stream-specific export logic
└── components/
    └── stream-details-view.tsx    # Updated with export button
```

### Type Definitions
```typescript
interface StreamExportData {
  stream: {
    id: string;
    title: string;
    description: string;
    sender: string;
    token: {
      symbol: string;
      address: string;
      decimals: number;
    };
    deposit: string;
    startTime: string;
    endTime: string;
    status: string;
    contractAddress: string;
    explorerUrl: string;
  };
  analytics: {
    totalDeposit: string;
    totalDistributed: string;
    totalAvailable: string;
    remainingDeposit: string;
    duration: string;
    elapsed: string;
    remaining?: string;
  };
  recipients: RecipientExportData[];
  metadata: {
    exportedAt: string;
    exportedBy: string;
    network: string;
  };
}

interface RecipientExportData {
  address: string;
  ratePerSecond: string;
  ratePerHour: string;
  ratePerDay: string;
  totalWithdrawn: string;
  currentAvailable: string;
  totalReceived: string;
  lastWithdrawalTime: string;
  percentageOfDeposit: string;
  percentageOfDistributed: string;
}
```

### CSV Format Example
```csv
Stream Information
Stream ID,18
Title,Monthly Contributor Payments
Description,Payments for December 2025
Sender Address,0x7818CEd1298849B47a9B56066b5adc72CDDAf733
Token Symbol,cUSD
Token Address,0x765DE816845861e75A25fCA122bb6898B8B1282a
Total Deposit,4.975 cUSD
Start Time,2025-12-06 02:07:15 UTC
End Time,2025-12-06 03:07:15 UTC
Status,Active
Contract Address,0x5530975fDe062FE6706298fF3945E3d1a17A310a
Explorer URL,https://celoscan.io/address/0x5530975fDe062FE6706298fF3945E3d1a17A310a

Analytics Summary
Total Deposit,4.975 cUSD
Total Distributed,0.161111 cUSD
Total Available to Withdraw,0.161111 cUSD
Remaining Deposit,4.813889 cUSD
Duration,1 hour
Time Elapsed,2 minutes
Time Remaining,58 minutes

Recipients
Recipient Address,Rate Per Second,Rate Per Hour,Rate Per Day,Total Withdrawn,Current Available,Total Received,Last Withdrawal Time,% of Deposit,% of Distributed
0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7,0.001388888888888889 cUSD,5.0 cUSD,120.0 cUSD,0.0 cUSD,0.161111 cUSD,0.161111 cUSD,Never,3.24%,100.00%

Export Metadata
Exported At,2025-12-06 02:09:11 UTC
Exported By,0x7818CEd1298849B47a9B56066b5adc72CDDAf733
Network,Celo Mainnet
```

---

## Dependencies

### No New Dependencies Required
- Uses native browser APIs for file download
- Uses existing utility functions for formatting
- No external CSV libraries needed

---

## Success Criteria

1. ✅ Stream owner can export stream data as CSV
2. ✅ CSV includes all stream details, analytics, and recipient data
3. ✅ CSV opens correctly in Excel/Google Sheets
4. ✅ All data is properly formatted and readable
5. ✅ Export works for streams with any number of recipients
6. ✅ Export handles edge cases gracefully
7. ✅ Export button is only visible to stream owner
8. ✅ Loading states and error handling work correctly

---

## Future Enhancements (Post-MVP)

1. **Export History**: Track when streams were exported
2. **Scheduled Exports**: Automatically generate and email CSV reports
3. **Multiple Format Support**: JSON, Excel (.xlsx), PDF
4. **Custom Fields**: Allow users to select which fields to include
5. **Batch Export**: Export multiple streams at once
6. **API Endpoint**: Server-side export for large datasets
7. **Export Templates**: Pre-defined export formats for different use cases

---

## Estimated Total Time

- **Phase 1**: 2-3 hours
- **Phase 2**: 1-2 hours
- **Phase 3**: 3-4 hours
- **Phase 4**: 2-3 hours
- **Phase 5**: 2-3 hours

**Total**: 10-15 hours

---

## Risk Assessment

### Low Risk
- CSV generation is straightforward
- No external dependencies
- No blockchain interactions required
- Client-side only operation

### Potential Issues
- Large recipient lists might slow down CSV generation (mitigate with pagination if needed)
- Special characters in titles/descriptions need proper escaping
- Browser compatibility for file downloads (should work in all modern browsers)

---

## Next Steps

1. Review and approve this implementation plan
2. Start with Phase 1 (Core CSV Utilities)
3. Test each phase before moving to the next
4. Iterate based on feedback





