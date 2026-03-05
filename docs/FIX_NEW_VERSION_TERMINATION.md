# Fix: New Contract Versions Showing "Terminated in year 0"

## Problem
After creating a contract modification (termination + new lease), the **new version (v2)** was incorrectly showing "Terminated in year 0" even though it's a brand new lease that should not be terminated.

## Root Cause
When creating a new version in the backend, the code was spreading `currentContract.data` which included termination flags (`TerminatedEarly`, `TerminationDate`, etc.) from the original contract. These flags were being inherited by the new contract.

## Solution

### 1. Backend Fix ([contracts.ts:634-643](backend/src/routes/contracts.ts#L634-L643))

**Before:**
```typescript
const mergedData = {
  ...currentContract.data,
  ...newData,
  CommencementDate: modificationDate,
  ContractID: newContractId,
};
```

**After:**
```typescript
const mergedData = {
  ...currentContract.data,
  ...newData,
  CommencementDate: modificationDate,
  ContractID: newContractId,
  // Remove termination flags from the new contract - this is a fresh lease
  TerminatedEarly: false,
  TerminationDate: undefined,
  EndDateOriginal: undefined,
};
```

### 2. Frontend Fix - Part A: Strict Checking ([ResultsDisplay.tsx:370, 640](src/components/Calculations/ResultsDisplay.tsx#L370))

Changed the condition from loose checking to strict checking:

**Before:**
```typescript
if (!leaseData.TerminatedEarly || !leaseData.TerminationDate || !leaseData.CommencementDate) {
```

**After:**
```typescript
if (leaseData.TerminatedEarly !== true || !leaseData.TerminationDate || !leaseData.CommencementDate) {
```

This ensures that only contracts with `TerminatedEarly` explicitly set to `true` will show termination warnings and have filtered tables.

### 3. Frontend Fix - Part B: Version Switching ([ResultsDisplay.tsx:72-96](src/components/Calculations/ResultsDisplay.tsx#L72-L96))

Added data cleanup when switching between versions to prevent termination flags from persisting:

**Before:**
```typescript
const handleVersionSelect = async (version: SavedContract) => {
  // ...
  const versionData = version.data;
  // ...
};
```

**After:**
```typescript
const handleVersionSelect = async (version: SavedContract) => {
  // ...
  const versionData = { ...version.data };

  // Clean up termination flags if they're not explicitly true
  if (versionData.TerminatedEarly !== true) {
    versionData.TerminatedEarly = false;
    versionData.TerminationDate = undefined;
  }
  // ...
};
```

This fix prevents the issue where navigating from v1 (terminated) to v2 (not terminated) would cause v2 to incorrectly show "Terminated in year 0".

### 4. Backend Fix - Missing Version Fields ([contracts.ts:36-162](backend/src/routes/contracts.ts#L36-L162))

The backend API endpoints were not returning version-related fields, causing the frontend to be unable to determine which version was being displayed.

**Added to all contract responses:**
```typescript
{
  // ... existing fields
  version: row.version || 1,
  baseContractId: row.base_contract_id,
  modificationDate: row.modification_date,
  previousVersionId: row.previous_version_id,
  isActive: row.is_active ?? true,
  modificationReason: row.modification_reason
}
```

This fix resolves the issue where:
- Version history would highlight v1 even when viewing v2
- Frontend couldn't determine the correct version to highlight
- `currentContract.version` was always `undefined`

## Files Modified

1. **backend/src/routes/contracts.ts**
   - Lines 36-54: Added version fields to GET all contracts response
   - Lines 82-99: Added version fields to GET single contract response
   - Lines 145-162: Added version fields to POST create contract response
   - Lines 634-643: Explicitly set termination flags to false/undefined for new contract versions
   - **Critical Fix**: Backend was missing `version`, `baseContractId`, `modificationDate`, etc. in API responses

2. **src/components/Calculations/ResultsDisplay.tsx**
   - Lines 24-35: Fixed version state initialization and calculation
   - Lines 66-69: Reset viewingVersion when contract changes
   - Lines 72-96: Clean up termination flags when switching versions
   - Lines 370, 640: Use strict equality checking (`=== true`) instead of truthy checking
   - Prevents undefined/null values from being treated as terminated

## Expected Behavior After Fix

### Original Contract (v1):
- ✅ Shows "Terminated Early" badge in version history
- ✅ Shows "Terminated in year X" on Lease Term card
- ✅ Tables filtered to show only periods up to termination
- ✅ KPIs show full original calculations (preserved)

### New Contract Version (v2+):
- ✅ No termination warnings or badges
- ✅ Full tables displayed (not filtered)
- ✅ Independent calculations based on new lease terms
- ✅ Fresh lease with no termination metadata

## Testing

To verify the fix:
1. Restart the backend server
2. Hard refresh the browser (Ctrl+Shift+R)
3. View any v2+ contract
4. Should NOT see "Terminated in year 0" or any termination warnings
5. Original contracts (v1) should still show termination info correctly

## Database State

The database already has correct data (verified with debug script):
- v1 contracts: `TerminatedEarly: true`
- v2+ contracts: `TerminatedEarly: undefined` (falsy)

The fix ensures the frontend correctly interprets this data.

---

**Implementation Date**: 2026-01-27
**Status**: ✅ Complete
