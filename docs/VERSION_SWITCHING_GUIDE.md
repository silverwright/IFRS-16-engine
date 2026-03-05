# Version Switching Feature - Implementation Guide

## Overview

This document describes the implementation of the **Version Switching** feature, which allows users to click on different contract versions in the Version History panel to view their respective cashflow and amortization schedules.

## Problem Statement

Previously, when a lease contract was terminated early and a new lease was created (using "Termination & New Lease"), users could see both versions listed but couldn't easily switch between them to view:
- **Original Contract**: Cashflow and amortization up to the termination date
- **New Contract**: Cashflow and amortization from the termination date onwards

## Solution Implemented

### 1. Backend Termination Fix

**File**: `backend/src/routes/contracts.ts` (Lines 641-669)

When `modificationType === 'termination'`, the backend now:

```typescript
// Calculate actual years from commencement to termination
const yearsUntilTermination = (terminationDate - commencementDate) / (1000 * 60 * 60 * 24 * 365.25);

// Update original contract with termination data
await supabase.from('contracts').update({
  data: {
    ...currentContract.data,
    EndDate: modificationDate,                      // Set end date to termination date
    EndDateOriginal: originalEndDate,               // Preserve original planned end date
    NonCancellableYears: yearsUntilTermination,     // KEY FIX: Update lease term years
    NonCancellableYearsOriginal: originalNonCancellableYears,
    TerminatedEarly: true,
    TerminationDate: modificationDate,
    // Clear renewal and termination options
    RenewalOptionYears: 0,
    RenewalOptionLikelihood: 0,
    TerminationOptionPoint: '0',
    TerminationOptionLikelihood: 0,
  }
}).eq('id', id);
```

**Key Points**:
- Updates `NonCancellableYears` to the actual years until termination (this is critical for calculations)
- Sets `TerminatedEarly: true` flag for UI indicators
- Preserves original values in `*Original` fields for historical reference

### 2. Frontend Version Switching

**File**: `src/components/Calculations/ResultsDisplay.tsx`

#### A. New Handler Function (Lines 66-86)

```typescript
const handleVersionSelect = async (version: SavedContract) => {
  try {
    setRecalculating(true);

    // Load the selected version's data
    const versionData = version.data;

    // Recalculate with the selected version's data
    const versionCalculations = calculateIFRS16(versionData);

    // Update the context with the selected version
    dispatch({ type: 'SET_LEASE_DATA', payload: versionData });
    dispatch({ type: 'SET_CALCULATIONS', payload: versionCalculations });

    // Scroll to top to show the new data
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Failed to load version:', error);
    alert('Failed to load the selected version. Please try again.');
  } finally {
    setRecalculating(false);
  }
};
```

**How it Works**:
1. Fetches the selected version's data
2. Recalculates IFRS 16 metrics using that version's data
3. Updates the global context so all components show the selected version
4. Scrolls to top for better UX

#### B. Clickable Version History Items (Lines 445-479)

Changed from `<div>` to `<button>` elements with:
- `onClick={() => handleVersionSelect(version)}` - Triggers version switch
- Hover effects for better UX
- Disabled state during recalculation
- Visual indicators for current version and terminated contracts

```typescript
<button
  key={version.id}
  onClick={() => handleVersionSelect(version)}
  disabled={recalculating}
  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
    version.version === currentVersion
      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
      : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
  }`}
>
  {/* Version details */}
  {version.data?.TerminatedEarly && (
    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
      ⚠️ Terminated Early
    </p>
  )}
</button>
```

#### C. Loading Overlay (Lines 363-371)

Added a full-screen loading overlay during version switching:

```typescript
{recalculating && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className="font-medium">Loading version...</span>
      </div>
    </div>
  </div>
)}
```

#### D. Visual Indicators (Lines 380-387)

Added badges to show contract status:

```typescript
{leaseData.TerminatedEarly && (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
    ⚠️ Terminated Early
  </span>
)}
```

## User Experience Flow

### Scenario: 10-Year Lease Terminated at Year 5

1. **Original Contract (v1)**:
   - User initiates a 10-year lease
   - Contract shows full 10-year cashflow and amortization

2. **Create Termination**:
   - User clicks "Modify Contract"
   - Selects "Termination & New Lease"
   - Sets effective date to Year 5
   - Enters new lease terms

3. **After Termination**:
   - Two versions now exist:
     - **v1 (Original Contract)**: Shows cashflow/amortization for Years 1-5 only
     - **v2 (Modification 1)**: Shows cashflow/amortization from Year 5 onwards

4. **Switching Between Versions**:
   - Click "Version History (2)" button to open panel
   - Click on "Original Contract" → See Years 1-5 calculations
   - Click on "Modification 1" → See Years 5+ calculations

## Key Features

✅ **Clickable Version History**: Each version is a clickable button
✅ **Real-time Recalculation**: Switching versions triggers IFRS 16 recalculation
✅ **Visual Feedback**: Loading overlay during calculation
✅ **Status Indicators**: Shows which version is current and which are terminated
✅ **Smooth UX**: Auto-scroll to top after switching
✅ **Proper Termination**: Original contracts properly truncated at termination date

## Technical Details

### Calculation Logic

The IFRS 16 calculator uses `NonCancellableYears` to determine how many periods to calculate:

```typescript
// From ifrs16Calculator.ts
const nonCancellableYears = leaseData.NonCancellableYears || 0;
const periods = Math.round(totalLeaseYears * getPeriodsPerYear(paymentFrequency));
```

When a contract is terminated:
- Original contract's `NonCancellableYears` is updated to actual years until termination
- This ensures the amortization schedule only generates periods up to termination
- New contract starts fresh with its own `NonCancellableYears` from termination date

### State Management

Version switching updates the global context:
```typescript
dispatch({ type: 'SET_LEASE_DATA', payload: versionData });
dispatch({ type: 'SET_CALCULATIONS', payload: versionCalculations });
```

This ensures all components (KPI cards, tables, charts) show the selected version's data.

## Testing

To test the feature:

1. Create a lease contract with 10-year term
2. View the initial calculations (120 monthly periods)
3. Modify the contract:
   - Select "Termination & New Lease"
   - Set effective date to 5 years in
   - Enter new terms
4. Open "Version History"
5. Click "Original Contract" → Should show ~60 periods (5 years)
6. Click "Modification 1" → Should show remaining periods for new lease

## Files Modified

1. **backend/src/routes/contracts.ts** (Lines 641-669)
   - Fixed termination logic to update `NonCancellableYears`

2. **src/components/Calculations/ResultsDisplay.tsx**
   - Added `handleVersionSelect` function (Lines 66-86)
   - Made version history items clickable (Lines 445-479)
   - Added loading overlay (Lines 363-371)
   - Added status indicators (Lines 380-387)

## Future Enhancements

- Add comparison view to see multiple versions side-by-side
- Export specific version calculations to Excel/PDF
- Version diff view showing what changed between versions
- Restore previous version functionality
- Version timeline visualization

---

**Implementation Date**: 2026-01-27
**Author**: Claude Code Assistant
