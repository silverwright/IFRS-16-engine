# Lease Contract Modification & Versioning Guide

## Overview

The IFRS 16 Lease Engine now supports **two types of contract modifications with version tracking**. This feature allows you to modify lease contracts following proper IFRS 16 accounting treatment, with full audit trail and version control.

## Key Features

- ✅ **Two Modification Types**: Choose between Amendment (term changes) or Termination & New Lease
- ✅ **Version Control**: Track all modifications with version numbers (v1, v2, v3, etc.)
- ✅ **Historical Preservation**: All calculations before the modification date remain unchanged
- ✅ **Forward Application**: New values (payment, IBR) apply only from modification date onward
- ✅ **Full Audit Trail**: View complete version history with modification dates and reasons
- ✅ **IFRS 16 Compliant**: Follows lease modification accounting principles (IFRS 16.44-46)

## Modification Types

### 1. Amendment (Lease Modification - IFRS 16.44-46)

**When to Use:**
- Rent increases/decreases during the lease term
- Payment frequency changes
- Discount rate adjustments
- Changes to payment timing or escalation terms
- Any scenario where the lease continues with modified terms

**How It Works:**
- Original lease continues with modified terms from the effective date
- Version 1 remains for historical reference (marked inactive)
- Version 2 contains the complete contract with new terms
- Both versions show the full original lease term
- For calculations: Use V1 data before effective date, V2 data after

**Example:**
- Original: 10-year lease at ₦1,000,000/year
- Year 4: Rent increases to ₦1,200,000/year
- Result: Version 2 shows modified rent from year 5 onwards, original term preserved

### 2. Termination & New Lease

**When to Use:**
- Early termination with a new independent lease
- Complete renegotiation at a specific date
- Lease assignment/transfer
- Fundamental restructuring where old lease ends and new one begins

**How It Works:**
- Original lease is terminated early at the effective date
- Version 1 is updated with new end date (terminated early)
- Version 2 is a completely new separate lease starting from the termination date
- Each version has independent calculations and terms

**Example:**
- Original: 20-year lease (years 1-20)
- Year 5: Terminate and start new 15-year lease
- Result: Version 1 ends at year 5, Version 2 runs years 5-20 as new lease

## Version Naming Convention

Contracts use the pattern: `contract-id-v{version}`

- **Original**: `contract-123` or `contract-123-v1`
- **First Modification**: `contract-123-v2`
- **Second Modification**: `contract-123-v3`
- And so on...

## How It Works

### 1. **Create Original Contract**
   - User creates a contract with initial values
   - This becomes Version 1 (v1)
   - Example ID: `LEASE-001` or `LEASE-001-v1`

### 2. **Modify Contract**
   - When parties agree to change terms (e.g., Year 6 of 10-year lease)
   - User clicks "Modify Contract" button
   - Specifies:
     - **Modification Date**: When new terms take effect
     - **New Values**: Updated payment and/or IBR
     - **Reason**: Optional explanation (e.g., "Annual rent increase")

### 3. **Version Creation**
   - System creates Version 2 (v2) with ID: `LEASE-001-v2`
   - Calculations work as follows:
     - **Years 1-5**: Uses original payment (100,000) and IBR (5%)
     - **Years 6-10**: Uses new payment (120,000) and IBR (6.2%)
   - Version 1 is marked as inactive
   - Version 2 becomes the active version

### 4. **View History**
   - Click "Version History" to see all versions
   - Each version shows:
     - Version number
     - Modification date
     - Modification reason
     - Active status

## User Workflow

### Step-by-Step: Creating a Modification

1. **Navigate to Results Page**
   - Calculate your contract to view results
   - Locate the "Modify Contract" button

2. **Open Modification Modal**
   - Click "Modify Contract"
   - Modal shows: "Create Version X"

3. **Enter Modification Details**
   ```
   Modification Date: [Select date when changes take effect]
   Reason: e.g., "Annual rent increase effective Year 6"

   The modal is organized into collapsible sections:

   📊 Payment & Timing
   - Fixed Payment: 100,000 → 120,000
   - Payment Frequency: Monthly → Quarterly
   - Payment Timing: Advance → Arrears

   📅 Lease Term
   - Non-Cancellable Years: 10 → 15
   - End Date: [Can extend or adjust]

   💰 Discount Rate
   - IBR (%): 5.00% → 6.20%

   🔄 Renewal & Termination Options
   - Renewal Option Years: 5 → 10
   - Renewal Likelihood: 0.7 → 0.8
   - Termination Point: 0 → 7
   - Termination Likelihood: 0 → 0.5

   ⚙️ Other Modifications
   - Initial Direct Costs
   - Prepayments
   - Lease Incentives
   - Escalation Type: None → Fixed
   - Fixed Escalation %: 0 → 3
   ```

4. **Validate**
   - Modification date must be:
     - After commencement date
     - Before or equal to today
   - At least one value must change

5. **Submit**
   - Click "Create Version X"
   - System creates new version
   - Results update automatically

6. **View Results**
   - Version indicator appears: "Version 2"
   - Amortization schedule shows combined data:
     - Historical periods (original values)
     - Future periods (new values)

## Technical Implementation

### Database Schema

New columns added to `contracts` table:

```sql
version                INTEGER DEFAULT 1
base_contract_id       VARCHAR(255)      -- Original contract ID
modification_date      DATE              -- When modification takes effect
previous_version_id    UUID              -- Link to previous version
is_active             BOOLEAN DEFAULT true
modification_reason    TEXT              -- Explanation for modification
```

### Calculation Logic

The `leaseModificationCalculator` handles:

1. **Period Calculation**
   - Determines which period the modification occurs in
   - Based on commencement date → modification date

2. **Balance Preservation**
   - Extracts ending liability and ROU asset from last preserved period
   - Uses these as starting points for new calculations

3. **Forward Calculation**
   - Recalculates remaining periods with new values
   - Adjusts for remaining lease term

4. **Schedule Merging**
   - Combines preserved periods with new periods
   - Maintains continuous period numbering

### API Endpoints

#### Create Modification
```
POST /api/contracts/:id/modify
Body: {
  modificationDate: "2025-06-01",
  data: {
    FixedPaymentPerPeriod: 120000,
    IBR_Annual: 6.2
  },
  modificationReason: "Annual rent increase"
}
```

#### Get Version History
```
GET /api/contracts/versions/:baseContractId
Returns: Array of all versions
```

## Examples

### Example 1: Mid-Lease Payment Increase

**Original Contract (v1)**
- Commencement: 2020-01-01
- Term: 10 years
- Payment: 100,000 monthly
- IBR: 5%

**Modification (v2) - Year 6**
- Modification Date: 2025-06-01
- New Payment: 120,000 monthly
- New IBR: 6.2%
- Reason: "Annual rent increase and market rate adjustment"

**Result:**
- Years 1-5: Payment 100,000, IBR 5% (preserved)
- Years 6-10: Payment 120,000, IBR 6.2% (new)
- Contract ID: `LEASE-001-v2`

### Example 2: Term Extension with Multiple Changes

**Original Contract (v1)**
- Commencement: 2020-01-01
- Non-Cancellable: 10 years
- Payment: 100,000 monthly
- IBR: 5%
- Renewal Option: None

**Modification (v2) - Year 8**
- Modification Date: 2028-01-01
- New Non-Cancellable Years: 15 years (extension)
- New Payment: 110,000 monthly
- New Payment Frequency: Quarterly
- New IBR: 5.5%
- Add Renewal Option: 5 years at 70% likelihood
- Reason: "Lease extension agreement"

**Result:**
- Years 1-8: Original terms (preserved)
- Years 9-15: New terms applied
- Contract ID: `LEASE-001-v2`

### Example 3: Multiple Sequential Modifications

**v1**: Original (2020-2025)
- Payment: 100,000
- IBR: 5%

**v2**: First Mod (2025-2028)
- Payment: 120,000
- IBR: 6.2%
- Reason: "Annual rent increase"

**v3**: Second Mod (2028-2030)
- Payment: 150,000
- IBR: 7%
- Reason: "Market adjustment"

**Final Schedule:**
- Years 1-5: 100,000 @ 5%
- Years 6-8: 120,000 @ 6.2%
- Years 9-10: 150,000 @ 7%

## Best Practices

1. **Timing**
   - Align modification dates with period starts (e.g., start of month/quarter)
   - Document reasons clearly for audit purposes

2. **Documentation**
   - Always provide a modification reason
   - Reference supporting documents (e.g., lease amendment #)

3. **Testing**
   - Preview calculations before creating modification
   - Verify preserved periods remain unchanged

4. **Version Management**
   - Don't delete old versions - they're part of audit trail
   - Keep version history for compliance

## Compliance Notes

This feature implements IFRS 16 lease modification accounting:

- **IFRS 16.44-46**: Lease modifications
- **Remeasurement**: New lease liability calculated from modification date
- **ROU Asset**: Adjusted by difference in lease liability
- **Discount Rate**: Can use revised rate if appropriate

## Troubleshooting

### Issue: "Modification date cannot be before commencement date"
**Solution**: Ensure modification date is after the original commencement date

### Issue: "No changes detected"
**Solution**: Modify at least one value (payment or IBR) and ensure it's different from current value

### Issue: Version history not loading
**Solution**: Check backend connection and ensure database migration is applied

## Database Migration

Before using this feature, run the database migration:

```sql
-- Apply the migration
psql -U your_user -d your_database -f backend/migrations/add_version_tracking.sql
```

Or in Supabase SQL Editor, run:
```sql
-- See: backend/migrations/add_version_tracking.sql
```

## Future Enhancements

Potential features for future versions:

- [ ] Revert to previous version
- [ ] Compare versions side-by-side
- [ ] Bulk modifications across multiple contracts
- [ ] Automated version creation from scheduled escalations
- [ ] Export version comparison reports

## Support

For questions or issues:
- Check the implementation in `src/utils/leaseModificationCalculator.ts`
- Review API endpoints in `backend/src/routes/contracts.ts`
- See UI component in `src/components/Contract/ModifyContractModal.tsx`
