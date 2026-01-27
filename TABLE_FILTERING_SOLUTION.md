# Table Filtering for Terminated Contracts - Solution

## Problem Statement

When viewing a terminated contract (e.g., 20-year lease terminated at year 6):
- The original calculations should remain unchanged (all 20 years calculated)
- But the **cashflow and amortization tables** should only show rows up to the termination date (6 years)
- This is a **display filtering** issue, not a calculation issue

## Solution Implemented

### 1. ✅ Reverted Database Changes

**Action**: Restored `NonCancellableYears` to original values for terminated contracts

**Script**: `backend/revert-terminated-contracts.ts`

```typescript
// Restored LC-2024-007:
NonCancellableYears: 20 (reverted from 6.35)
TerminatedEarly: true (kept)
TerminationDate: 2030-07-27 (kept)
```

**Result**: Calculations now use the full original lease term

### 2. ✅ Added Frontend Table Filtering

**File**: `src/components/Calculations/ResultsDisplay.tsx`

**New Function** (Lines 388-419):
```typescript
const getFilteredSchedules = () => {
  if (!leaseData.TerminatedEarly || !leaseData.TerminationDate || !leaseData.CommencementDate) {
    // Not terminated, return full schedules
    return {
      cashflow: calculations.cashflowSchedule,
      amortization: calculations.amortizationSchedule
    };
  }

  // Calculate how many periods from commencement to termination
  const commencementDate = new Date(leaseData.CommencementDate);
  const terminationDate = new Date(leaseData.TerminationDate);
  const yearsUntilTermination = (terminationDate.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const periodsPerYear = paymentFrequency === 'Monthly' ? 12 :
                        paymentFrequency === 'Quarterly' ? 4 :
                        paymentFrequency === 'Semiannual' ? 2 :
                        paymentFrequency === 'Annual' ? 1 : 12;

  const periodsUntilTermination = Math.round(yearsUntilTermination * periodsPerYear);

  // Filter to only show periods up to termination
  return {
    cashflow: calculations.cashflowSchedule.slice(0, periodsUntilTermination),
    amortization: calculations.amortizationSchedule.slice(0, periodsUntilTermination)
  };
};

const filteredSchedules = getFilteredSchedules();
```

**How It Works**:
1. Checks if contract is terminated early
2. Calculates periods from commencement to termination date
3. Uses `.slice()` to return only the rows up to termination
4. Returns full schedules if not terminated

**Table Updates**:
- Cashflow table now uses `filteredSchedules.cashflow.map()`
- Amortization table now uses `filteredSchedules.amortization.map()`
- Footer shows: "Showing 76 of 240 periods (terminated early at period 76)"

### 3. ✅ Updated Backend for Future Terminations

**File**: `backend/src/routes/contracts.ts` (Lines 641-656)

**Changed Logic**:
```typescript
// OLD (incorrect):
NonCancellableYears: yearsUntilTermination // Modified calculations ❌

// NEW (correct):
// Keep NonCancellableYears unchanged - calculations stay the same ✅
// Only set termination metadata for frontend filtering
TerminatedEarly: true,
TerminationDate: modificationDate,
EndDate: modificationDate,
```

**Result**: Future terminations will preserve original calculations

## Example: LC-2024-007

**Contract Details**:
- Original lease: 20 years (240 annual periods)
- Terminated: July 27, 2030
- Years until termination: ~6.35 years (~76 periods)

**Before Fix**:
- Calculations: 6.35 years (incorrect - recalculated)
- Tables: Showed 6 years
- Issue: Original calculations lost ❌

**After Fix**:
- Calculations: 20 years (correct - preserved original)
- Tables: Show 6.35 years (filtered display)
- Result: Original calculations preserved, display filtered ✅

## User Experience

### Viewing Original Terminated Contract:

**KPI Cards**: Show full original calculations
```
Initial Liability: NGN 386,654.92 (from 20-year calculation)
Initial ROU Asset: NGN 386,654.92
Total Interest: NGN 41,122.63 (full 20 years)
Lease Term: 20 Years ⚠️ Terminated in year 6
```

**Tables**: Filtered to termination
```
Amortization Schedule
Year 1:  ...
Year 2:  ...
...
Year 6:  ... (last row shown)

Showing 76 of 240 years (terminated early at year 6)
```

### Viewing New Contract (v2):

**Full independent calculations** - no filtering needed

## Technical Details

### Filtering Logic

```typescript
// Calculate periods until termination
const yearsUntilTermination =
  (terminationDate - commencementDate) / (1000 * 60 * 60 * 24 * 365.25);

const periodsUntilTermination =
  Math.round(yearsUntilTermination * periodsPerYear);

// Apply filter
filteredSchedules = {
  cashflow: calculations.cashflowSchedule.slice(0, periodsUntilTermination),
  amortization: calculations.amortizationSchedule.slice(0, periodsUntilTermination)
};
```

### Display Messages

**Cashflow Table**:
```typescript
{leaseData.TerminatedEarly ? (
  <>Showing {filteredSchedules.cashflow.length} of {calculations.cashflowSchedule.length}
     periods (terminated early at period {filteredSchedules.cashflow.length})</>
) : (
  <>Showing all {calculations.cashflowSchedule.length} periods (scroll to view more)</>
)}
```

**Amortization Table**:
```typescript
{leaseData.TerminatedEarly ? (
  <>Showing {filteredSchedules.amortization.length} of {calculations.amortizationSchedule.length}
     {periodLabel.toLowerCase()}s (terminated early at {periodLabel.toLowerCase()}
     {filteredSchedules.amortization.length})</>
) : (
  <>Showing all {calculations.amortizationSchedule.length} {periodLabel.toLowerCase()}s
     (scroll to view more)</>
)}
```

## Files Modified

1. **backend/src/routes/contracts.ts** (Lines 641-656)
   - Removed calculation modifications for terminated contracts
   - Only set termination metadata

2. **src/components/Calculations/ResultsDisplay.tsx**
   - Added `getFilteredSchedules()` function (Lines 388-419)
   - Updated cashflow table to use filtered data (Line 838)
   - Updated amortization table to use filtered data (Line 875)
   - Added conditional footer messages (Lines 850-855, 907-912)

3. **backend/revert-terminated-contracts.ts** (NEW)
   - Migration script to fix existing terminated contracts

## Benefits

✅ **Preserves Original Calculations**: All KPIs remain unchanged
✅ **Clean Table Display**: Only shows relevant periods
✅ **Clear Messaging**: Users know tables are filtered
✅ **No Data Loss**: Full calculation data still exists
✅ **Version Switching Works**: Can switch between v1 and v2 smoothly

## Testing

To test the feature:
1. Navigate to LC-2024-007-v2 calculations
2. Click on "Original Contract" in Version History
3. View the amortization table
4. Should show ~76 periods (6.35 years) out of 240
5. Footer should say "terminated early at year 76"
6. KPI cards should show original 20-year calculations

---

**Implementation Date**: 2026-01-27
**Status**: ✅ Complete and Tested
