# Version Switching Feature - Visual Demo

## Feature Overview

The Version Switching feature allows you to click between different contract versions to view their respective calculations.

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Calculation Results                     [Version History (2)]│
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Version History                                      │    │
│  │ Click to view different versions                     │    │
│  │                                                       │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │ v1  Original Contract              Current │ ◄───┼────┼─── Click to view Years 1-5
│  │  │     Created on 12/15/2025                  │     │    │
│  │  │     ⚠️ Terminated Early                     │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  │                                                       │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │ v2  Modification 1                         │ ◄───┼────┼─── Click to view Years 5-15
│  │  │     Modified on 7/27/2030                  │     │    │
│  │  │     New Lease Agreement                    │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Initial Liability    Initial ROU    Total Interest  │    │
│  │   ₦5,000,000        ₦5,200,000       ₦800,000      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Amortization Schedule                                │    │
│  │ ┌──────┬─────────┬──────────┬────────┬──────────┐  │    │
│  │ │Period│ Payment │ Interest │ Principal│ Balance │  │    │
│  │ ├──────┼─────────┼──────────┼────────┼──────────┤  │    │
│  │ │  1   │ 100,000 │  58,333  │ 41,667 │4,958,333│  │    │
│  │ │  2   │ 100,000 │  57,847  │ 42,153 │4,916,180│  │    │
│  │ │ ...  │   ...   │   ...    │  ...   │   ...   │  │    │
│  │ │  60  │ 100,000 │   583    │ 99,417 │     0   │  │◄───── Shows only up to
│  │ └──────┴─────────┴──────────┴────────┴──────────┘  │      termination date
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Example Scenario: 10-Year Lease Terminated at Year 5

### Initial State (Version 1)
- **Lease Term**: 10 years (120 monthly payments)
- **Monthly Payment**: ₦100,000
- **Commencement**: January 1, 2025

**Amortization Schedule**: Periods 1-120 (all 10 years)

### After Termination (Creating Version 2)

#### Version 1 - Original Contract (Terminated)
```
Status: ⚠️ Terminated Early
Lease Term: 5 years (60 monthly payments)
End Date: December 31, 2029 (updated to termination date)
NonCancellableYears: 5 years (updated from original 10)

Amortization Schedule: Periods 1-60 ONLY
Period 1:  Month 1 (Jan 2025) - Payment ₦100,000
Period 2:  Month 2 (Feb 2025) - Payment ₦100,000
...
Period 60: Month 60 (Dec 2029) - Payment ₦100,000 ← ENDS HERE
```

#### Version 2 - New Contract
```
Status: Active
Lease Term: 10 years (120 monthly payments)
Start Date: January 1, 2030 (starts from termination date)
NonCancellableYears: 10 years
Monthly Payment: ₦120,000 (new terms)

Amortization Schedule: Periods 1-120 (full new lease)
Period 1:  Month 1 (Jan 2030) - Payment ₦120,000
Period 2:  Month 2 (Feb 2030) - Payment ₦120,000
...
Period 120: Month 120 (Dec 2039) - Payment ₦120,000
```

## User Interaction Flow

### Step 1: View Version History
```
┌────────────────────────────────────────┐
│  [Version History (2)] ◄────── Click  │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Version History Panel Opens           │
│  - Original Contract                   │
│  - Modification 1                      │
└────────────────────────────────────────┘
```

### Step 2: Click on Original Contract
```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────┐     │
│  │ v1 Original Contract  Current│◄────── Click
│  │    ⚠️ Terminated Early        │     │
│  └──────────────────────────────┘     │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Loading overlay appears               │
│  "Loading version..."                  │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Calculations update to show:          │
│  - Years 1-5 only                      │
│  - 60 monthly periods                  │
│  - Original payment amounts            │
└────────────────────────────────────────┘
```

### Step 3: Click on Modification 1
```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────┐     │
│  │ v2 Modification 1            │◄────── Click
│  │    New Lease Agreement       │     │
│  └──────────────────────────────┘     │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Loading overlay appears               │
│  "Loading version..."                  │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  Calculations update to show:          │
│  - Years 5-15 (new lease)              │
│  - 120 monthly periods                 │
│  - New payment amounts                 │
└────────────────────────────────────────┘
```

## What Happens Behind the Scenes

### When You Click a Version:

1. **Data Fetch**
   ```typescript
   const versionData = version.data;
   // Contains all lease parameters for that version
   ```

2. **Recalculation**
   ```typescript
   const versionCalculations = calculateIFRS16(versionData);
   // Calculates:
   // - Initial liability
   // - Initial ROU asset
   // - Amortization schedule (respects NonCancellableYears)
   // - Cashflow schedule
   // - Interest and depreciation totals
   ```

3. **State Update**
   ```typescript
   dispatch({ type: 'SET_LEASE_DATA', payload: versionData });
   dispatch({ type: 'SET_CALCULATIONS', payload: versionCalculations });
   // Updates all components to show selected version
   ```

4. **UI Updates**
   - KPI cards refresh with new values
   - Amortization table shows correct periods
   - Cashflow schedule updates
   - All charts and visualizations refresh

## Key Indicators

### Current Version Badge
```
┌────────────────────────────────┐
│ Calculation Results            │
│ [GitBranch Icon] Version 2     │ ◄─── Shows which version is loaded
└────────────────────────────────┘
```

### Terminated Early Badge
```
┌────────────────────────────────┐
│ Calculation Results            │
│ ⚠️ Terminated Early            │ ◄─── Shows if contract was ended early
└────────────────────────────────┘
```

### Version History Item States

**Current Version** (Blue highlight):
```
┌──────────────────────────────────────┐
│ v2  Modification 1          Current  │ ◄─── Currently viewing
│     Modified on 7/27/2030            │
└──────────────────────────────────────┘
```

**Other Versions** (Gray, hover to highlight):
```
┌──────────────────────────────────────┐
│ v1  Original Contract                │ ◄─── Click to switch
│     Created on 12/15/2025            │
│     ⚠️ Terminated Early              │
└──────────────────────────────────────┘
```

## Benefits

✅ **Compare Scenarios**: Easily switch between old and new terms
✅ **Historical View**: See original contract calculations preserved
✅ **Audit Trail**: Track how lease terms changed over time
✅ **Decision Support**: Analyze impact of modifications
✅ **Compliance**: Maintain complete history for accounting standards

## Related Features

- **Amendment Notice**: Shows what changed in amendments
- **Modify Contract**: Create new versions (amendments or terminations)
- **Export Excel/PDF**: Export specific version calculations
- **Version History**: View all versions and their metadata

---

**Tip**: Keep the Version History panel open while working to quickly switch between versions!
