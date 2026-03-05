# Version Switching UI Improvements

## Changes Implemented

### 1. ✅ Dynamic Version Highlighting

The blue highlight now **moves** to whichever version you click on, making it clear which version's data you're currently viewing.

**Before**: Only the "current" version (latest) was highlighted
**After**: The highlighted version changes based on which one you clicked

#### Visual Example:

**Viewing Original Contract (v1):**
```
┌─────────────────────────────────────────────────────┐
│ Version History  Click to view different versions   │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ v1  Original Contract          Current   │ ◄─── BLUE HIGHLIGHT
│  │     Created on 12/15/2025                │      │
│  │     ⚠️ Terminated Early                   │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ v2  Modification 1                       │ ◄─── GRAY (not selected)
│  │     Modified on 7/27/2030                │      │
│  └──────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

**After Clicking Modification 1 (v2):**
```
┌─────────────────────────────────────────────────────┐
│ Version History  Click to view different versions   │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ v1  Original Contract                    │ ◄─── GRAY (not selected)
│  │     Created on 12/15/2025                │      │
│  │     ⚠️ Terminated Early                   │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ v2  Modification 1             Current   │ ◄─── BLUE HIGHLIGHT
│  │     Modified on 7/27/2030                │      │
│  └──────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### 2. ✅ New IBR (Discount Rate) Card

Added a new KPI card showing the Incremental Borrowing Rate (IBR) being used for calculations.

```
┌─────────────────────────────────────────┐
│  Discount Rate (IBR)        📉         │
│  14.00%                                 │
│  Per annum                              │
└─────────────────────────────────────────┘
```

**Details:**
- **Color**: Pink gradient (from-pink-500 to-pink-600)
- **Icon**: Trending down (representing discount rate)
- **Format**: Displays as percentage with 2 decimal places
- **Location**: Added as the 6th KPI card in the grid

### 3. ✅ Termination Notice on Lease Term Card

The Lease Term card now shows when a contract was terminated early.

**Original Contract (Terminated):**
```
┌─────────────────────────────────────────┐
│  Lease Term                    📊       │
│  14 Years                               │
│  ⚠️ Terminated in year 5                │
└─────────────────────────────────────────┘
```

**New Contract (Active):**
```
┌─────────────────────────────────────────┐
│  Lease Term                    📊       │
│  10 Years                               │
│                                         │
└─────────────────────────────────────────┘
```

**Details:**
- Shows termination year calculated from commencement date
- Only appears if `TerminatedEarly` flag is true
- Warning icon (⚠️) for visual emphasis
- Small text size (text-xs) to not clutter the card

## Technical Implementation

### State Management

```typescript
// Track which version user is currently viewing
const [viewingVersion, setViewingVersion] = useState<number>(1);

// Initialize based on current contract when component loads
useEffect(() => {
  if (currentContract?.version) {
    setViewingVersion(currentContract.version);
  }
}, [currentContract?.version]);
```

### Version Selection Logic

```typescript
const handleVersionSelect = async (version: SavedContract) => {
  try {
    setRecalculating(true);

    // Load version data
    const versionData = version.data;
    const versionCalculations = calculateIFRS16(versionData);

    // Update state
    dispatch({ type: 'SET_LEASE_DATA', payload: versionData });
    dispatch({ type: 'SET_CALCULATIONS', payload: versionCalculations });

    // ⭐ NEW: Update viewing version for highlighting
    setViewingVersion(version.version || 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    setRecalculating(false);
  }
};
```

### Dynamic Highlighting

```typescript
// Use viewingVersion instead of currentContract.version for highlighting
className={`... ${
  version.version === viewingVersion  // ⭐ Compares against viewing version
    ? 'bg-blue-50 border-blue-200'    // Blue if viewing this version
    : 'bg-slate-50 hover:bg-slate-100' // Gray otherwise
}`}
```

### Termination Year Calculation

```typescript
{leaseData.TerminatedEarly && leaseData.TerminationDate && (
  <p className="text-indigo-100 text-xs mt-2">
    ⚠️ Terminated in year {
      Math.ceil(
        (new Date(leaseData.TerminationDate).getTime() -
         new Date(leaseData.CommencementDate || '').getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
      )
    }
  </p>
)}
```

### IBR Display

```typescript
<div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-pink-100 text-sm font-medium">Discount Rate (IBR)</p>
      <p className="text-2xl font-bold mt-1">
        {((leaseData.IBR_Annual || 0) * 100).toFixed(2)}%
      </p>
      <p className="text-pink-100 text-xs mt-1">Per annum</p>
    </div>
    <div className="bg-white/20 p-3 rounded-lg">
      <TrendingDown className="w-6 h-6" />
    </div>
  </div>
</div>
```

## KPI Card Layout

The KPI cards are now displayed in a 3-column grid (on large screens):

```
Row 1:
┌─────────────────┬─────────────────┬─────────────────┐
│ Initial         │ Initial ROU     │ Total Interest  │
│ Liability       │ Asset           │                 │
└─────────────────┴─────────────────┴─────────────────┘

Row 2:
┌─────────────────┬─────────────────┬─────────────────┐
│ Total           │ Payment         │ Lease Term      │
│ Depreciation    │ Frequency       │ (with term note)│
└─────────────────┴─────────────────┴─────────────────┘

Row 3 (New):
┌─────────────────┐
│ Discount Rate   │ ⭐ NEW CARD
│ (IBR)           │
└─────────────────┘
```

## User Experience Flow

### Scenario: Switching from Original to Modified Contract

1. **User opens Version History**
   - Both versions shown
   - v1 (Original Contract) highlighted in blue with "Current" label
   - Shows "⚠️ Terminated Early" badge

2. **KPI Cards show v1 data:**
   - Lease Term: "14 Years" with "⚠️ Terminated in year 5"
   - IBR: "14.00% per annum"
   - All other metrics for the original contract

3. **User clicks on v2 (Modification 1)**
   - Loading overlay appears
   - Blue highlight **moves** from v1 to v2
   - "Current" label **moves** from v1 to v2

4. **KPI Cards update to show v2 data:**
   - Lease Term: "10 Years" (no termination note)
   - IBR: Shows new rate if changed (e.g., "15.50% per annum")
   - All metrics recalculated for the new contract

5. **User can switch back to v1**
   - Click v1 again
   - Blue highlight moves back
   - All metrics revert to original contract
   - Termination note reappears

## Benefits

✅ **Clear Visual Feedback**: Users always know which version they're viewing
✅ **Better Context**: IBR card helps understand the discount rate used
✅ **Termination Awareness**: Immediately see when/where contract was terminated
✅ **Improved UX**: More intuitive and informative interface
✅ **Accurate Highlighting**: Highlight follows the data being displayed

## Files Modified

- `src/components/Calculations/ResultsDisplay.tsx`
  - Added `viewingVersion` state (Line 27)
  - Updated `handleVersionSelect` to track viewing version (Line 75)
  - Changed highlighting logic to use `viewingVersion` (Line 480)
  - Added IBR card (Lines 618-632)
  - Added termination note to Lease Term card (Lines 606-612)
  - Added initialization effect for viewing version (Lines 59-63)

---

**Implementation Date**: 2026-01-27
**Build Status**: ✅ Successful (no errors)
