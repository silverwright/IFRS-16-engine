# IFRS 16 Lease Engine — Complete Application Walkthrough

> **Audience**: This document is written for anyone — technical or not — who needs to understand what this application does, why it exists, and how it works from the inside out.

---

## Table of Contents

1. [What Problem Does This App Solve?](#1-what-problem-does-this-app-solve)
2. [Key IFRS 16 Concepts You Need to Know](#2-key-ifrs-16-concepts-you-need-to-know)
3. [Application Overview](#3-application-overview)
4. [How the App Is Structured (Technical Map)](#4-how-the-app-is-structured-technical-map)
5. [Module 1 — Contract Initiation](#5-module-1--contract-initiation)
6. [Module 2 — Lease Calculations](#6-module-2--lease-calculations)
7. [Module 3 — Disclosure & Journals](#7-module-3--disclosure--journals)
8. [Module 4 — Approval Dashboard](#8-module-4--approval-dashboard)
9. [Module 5 — Dashboard (Portfolio Analytics)](#9-module-5--dashboard-portfolio-analytics)
10. [The IFRS 16 Calculation Engine — Deep Dive](#10-the-ifrs-16-calculation-engine--deep-dive)
11. [Lease Modifications (Amendments)](#11-lease-modifications-amendments)
12. [The Lease Agreement Generator](#12-the-lease-agreement-generator)
13. [User Roles and Access Control](#13-user-roles-and-access-control)
14. [Global State Management](#14-global-state-management)
15. [Data Flow: End-to-End User Journey](#15-data-flow-end-to-end-user-journey)
16. [Glossary of Terms](#16-glossary-of-terms)

---

## 1. What Problem Does This App Solve?

### The Business Problem

Before IFRS 16 came into effect (for most companies, January 2019), operating leases were treated as **off-balance-sheet** items. A company could lease offices, vehicles, or equipment for years and never show those obligations in its financial statements. This made balance sheets look cleaner than they really were.

**IFRS 16 changed everything.** Under this standard, companies that lease assets must now:

1. **Recognise a liability** — the present value of all future lease payments (what they owe the lessor)
2. **Recognise a Right-of-Use (ROU) asset** — the right to use the asset for the lease term

This means leases are now **on the balance sheet**, and accountants need to calculate exact numbers for every lease, every period.

### Why This Tool Is Necessary

Doing IFRS 16 calculations manually is tedious and error-prone:
- Every lease has different payment amounts, frequencies, and terms
- Discount rates must be applied using the **effective interest method**
- Renewal and termination options must be assessed for likelihood
- Each period requires precise journal entries
- Modifications require remeasurement from a specific date

This application **automates all of that** — from capturing lease data, to running calculations, to generating journal entries and audit-ready disclosures.

---

## 2. Key IFRS 16 Concepts You Need to Know

Before diving into the app, you need to understand the accounting concepts it implements.

### Lease Liability
The **present value** of all future lease payments. "Present value" means: what is the value of those future payments **today**, given that money today is worth more than money in the future?

```
Example:
You will pay $10,000 per month for 5 years (60 payments).
Simply adding them up gives $600,000.
But $10,000 paid in year 5 is worth less than $10,000 paid today.
The "present value" discounts future payments back to today's value.
```

### Incremental Borrowing Rate (IBR)
The discount rate used to calculate present value. It represents the rate of interest the lessee would have to pay if it borrowed funds to buy the asset. In Nigeria, for example, a company might use 14% annual IBR.

### Right-of-Use (ROU) Asset
The asset recognised on the balance sheet. It represents the **right to use** the leased item. It starts equal to the lease liability, adjusted for:
- `+` Initial Direct Costs (legal fees, commissions paid to get the lease)
- `+` Prepayments (rent paid before commencement)
- `−` Lease Incentives received (landlord's contribution to fit-out, etc.)

### Effective Interest Method
The method for calculating how much of each payment is **interest** versus **principal**:
```
Interest Expense = Opening Liability × Rate Per Period
Principal Repaid = Total Payment − Interest Expense
Closing Liability = Opening Liability − Principal Repaid
```

This is the same method used for any loan amortisation.

### Depreciation (Straight-Line)
The ROU asset is depreciated evenly over the lease term:
```
Depreciation Per Period = Initial ROU Asset ÷ Total Number of Periods
```

### Payment Timing: Advance vs. Arrears
- **Advance**: Payment at the **beginning** of each period (before you use the asset that period)
- **Arrears**: Payment at the **end** of each period (after you've used the asset)

This matters because advance payments are discounted one period less than arrears payments, making the initial liability slightly higher.

### Lease Term
The period for which the lease is non-cancellable, **plus** any renewal or termination option periods that are **reasonably certain** to be exercised (IFRS 16.18-19 defines "reasonably certain" — the app uses ≥ 50% likelihood as the threshold).

---

## 3. Application Overview

### What the App Does (In Plain English)

1. A user enters the details of a lease contract (property, vehicle, equipment, etc.)
2. The app calculates the lease liability and ROU asset
3. It generates the full amortisation schedule, depreciation schedule, and journal entries
4. The contract goes through an approval workflow
5. Reports and disclosures are generated for financial statement preparation

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + TypeScript | User interface |
| Styling | Tailwind CSS | Responsive, dark mode |
| State Management | React Context + useReducer | Global application state |
| Backend / Auth | Supabase | Authentication, database |
| Build Tool | Vite | Development server and bundling |
| Routing | React Router (HashRouter) | Page navigation |

### Why HashRouter?
The URL looks like `http://localhost:5173/#/contract`. The `#` exists because the app is deployed on a static hosting server (Netlify). Static servers only know how to serve the `index.html` file — they cannot handle custom URL paths. The `#` tells the browser: "everything after this is managed by JavaScript, not the server."

---

## 4. How the App Is Structured (Technical Map)

```
ifrs-16-engine/
│
├── src/
│   ├── App.tsx                    ← Root component; defines all routes
│   │
│   ├── context/
│   │   ├── LeaseContext.tsx        ← Global state: all lease data, calculations, contracts
│   │   └── AuthContext.tsx         ← Authentication: login, logout, user roles
│   │
│   ├── pages/                     ← One file per "page" (each route)
│   │   ├── Home.tsx               ← Landing page / module hub
│   │   ├── ContractInitiation.tsx ← Create/edit lease contracts
│   │   ├── LeaseCalculations.tsx  ← Run IFRS 16 calculations
│   │   ├── DisclosureJournals.tsx ← Journal entries and disclosures
│   │   ├── ApprovalDashboard.tsx  ← Approve/reject contracts
│   │   ├── Dashboard.tsx          ← Portfolio analytics
│   │   ├── Reports.tsx            ← Reporting
│   │   ├── Methodology.tsx        ← IFRS 16 methodology docs
│   │   └── Education.tsx          ← Learning module
│   │
│   ├── components/
│   │   ├── Contract/
│   │   │   ├── Forms/             ← The 4 form steps (BasicInfo, Payment, Advanced, Legal)
│   │   │   ├── Modals/            ← Popup dialogs (Modify, Preview, Contract)
│   │   │   ├── Display/           ← Contract list, preview, status badges
│   │   │   ├── Upload/            ← CSV bulk import
│   │   │   └── Selectors/         ← Contract selector dropdown
│   │   ├── Calculations/
│   │   │   ├── CalculationEngine.tsx  ← The "Run Calculations" button
│   │   │   └── ResultsDisplay.tsx     ← Shows all calculation results
│   │   ├── Layout/
│   │   │   └── Header.tsx         ← Top navigation bar
│   │   └── UI/                    ← Generic components (Button, Modal, ProgressBar)
│   │
│   ├── utils/
│   │   ├── ifrs16Calculator.ts        ← THE CORE: all IFRS 16 math
│   │   ├── leaseModificationCalculator.ts ← Handles lease amendments
│   │   └── contractGenerator.ts       ← Generates lease agreement HTML
│   │
│   ├── api/
│   │   ├── contractsApi.ts        ← REST API calls for contracts
│   │   └── approvalApi.ts         ← REST API calls for approvals
│   │
│   └── hooks/
│       └── useContracts.ts        ← Reusable hook for contract CRUD operations
│
├── backend/
│   └── migrations/                ← SQL files for database setup (Supabase)
│
└── docs/                          ← Documentation
```

### How the Provider Chain Works

The app wraps everything in three layers of "providers" — think of these as boxes inside boxes that make certain data available to everything inside them:

```
ThemeProvider                    ← Provides dark/light mode
  └── AuthProvider               ← Provides user login state
        └── LeaseProvider        ← Provides all lease data and calculations
              └── Your Pages     ← Can access all of the above
```

---

## 5. Module 1 — Contract Initiation

**Route**: `/#/contract`
**File**: `src/pages/ContractInitiation.tsx`

### Purpose
This is where a new lease contract is created — or an existing one is edited. Think of it as the **data entry module**.

### The Three Tabs

When you land on this page, you see three tabs:

| Tab | Purpose |
|---|---|
| **New Contract** | Fill in a 5-step form to enter lease details manually |
| **Import CSV** | Upload a spreadsheet of contracts in bulk |
| **Contract List** | View, edit, delete, or submit existing contracts |

---

### The 5-Step Wizard

Progress through the steps is tracked by a progress bar at the top. You cannot skip steps — each step feeds into the next.

#### Step 1 — Basic Information (`BasicInfoForm.tsx`)

Captures the **who, what, and when** of the lease.

| Field | What It Is |
|---|---|
| Contract ID | Unique identifier (auto-generated or manual). Must be unique per user. |
| Lessee Entity | The company using the asset (your company) |
| Lessor Name | The owner of the asset (the landlord / leasing company) |
| Asset Description | Plain description: "2nd floor office, 5 Victoria Island" |
| Asset Class | Category: Property, Vehicle, Equipment, IT, Other |
| Commencement Date | When the lease starts (first day you have the right to use the asset) |
| End Date | When the non-cancellable period ends |
| Non-Cancellable Years | Auto-calculated from the dates above |

> **Auto-Calculation Note**: `NonCancellableYears` is calculated automatically from the commencement and end dates. The user does not enter it directly.

---

#### Step 2 — Payment Details (`PaymentDetailsForm.tsx`)

Captures the **financial terms** — what you pay and how.

| Field | What It Is |
|---|---|
| Fixed Payment Per Period | The base rental amount (e.g., ₦500,000/month) |
| Payment Frequency | Monthly, Quarterly, Semiannual, or Annual |
| Payment Timing | Advance (pay at start of period) or Arrears (pay at end) |
| **Escalation** | |
| Escalation Type | None, Fixed (%), or CPI-linked |
| Fixed Escalation % | Annual rent increase percentage (e.g., 5%) |
| Base CPI | Starting CPI index value for CPI-linked leases |
| CPI Reset Month | Which month CPI is reviewed each year |
| First Reset Year Offset | How many years before first CPI reset |
| **Other Payments** | |
| Variable Payments (In-Substance Fixed) | Payments that look variable but are certain to occur |
| Variable Payments (Usage-Based) | True usage-based costs (excluded from liability calculation) |
| Residual Value Guarantee | Amount guaranteed at end of lease |
| RVG Reasonably Certain | Toggle: should RVG be included in liability? |
| Purchase Option Price | Right to buy the asset at end of lease |
| Purchase Option Reasonably Certain | Toggle: include purchase option in lease term? |
| IBR Annual | Incremental Borrowing Rate (e.g., 0.14 = 14% per year) |
| Currency | NGN, USD, GBP, EUR, etc. |

> **Business Logic**: The `VariablePaymentsUsageExpected` amount is **never included** in the IFRS 16 liability calculation. Only in-substance fixed payments qualify as lease payments under IFRS 16.26.

> **Validation**: If Payment Timing is "Advance", the system checks that `PrepaymentsBeforeCommencement` > 0. This is because advance payment implies a prepayment was made before commencement.

---

#### Step 3 — Advanced Options (`AdvancedOptionsForm.tsx`)

Captures **options and adjustments** that affect the lease term and initial measurement.

| Field | What It Is |
|---|---|
| Renewal Option Years | Additional years if the renewal option is exercised |
| Renewal Option Likelihood | Probability (0-100%) of exercising renewal |
| Termination Option Point | Year in which termination can occur |
| Termination Option Likelihood | Probability (0-100%) of exercising termination |
| Termination Penalty | Amount payable if lease is terminated early |
| Termination Reasonably Certain | Is termination expected? |
| **Sale-Leaseback** | |
| Carrying Amount | Book value of the asset (for sale-leaseback transactions) |
| Fair Value | Market value of the asset |
| Sales Proceeds | Amount received in the sale portion |
| **ROU Adjustments** | |
| Initial Direct Costs | Fees paid to secure the lease (commissions, legal fees) |
| Prepayments Before Commencement | Rent paid before the lease start date |
| Lease Incentives | Benefits received from lessor (e.g., fit-out contributions) |
| Useful Life (Years) | How long the asset is useful to the lessee |
| **Policy Elections** | |
| Low Value Exemption | Tick if asset value < USD 5,000 (IFRS 16.5b exemption) |
| Short-Term Exemption | Tick if lease term ≤ 12 months (IFRS 16.5a exemption) |
| Separate Non-Lease Components | Tick if service elements are separated from lease |

---

#### Step 4 — Legal & Admin (`LegalAdminForm.tsx`)

Captures parties' **legal details** for the formal contract document.

| Field | What It Is |
|---|---|
| Lessor/Lessee Jurisdiction | Country of each party |
| Lessor/Lessee Address | Registered addresses |
| RC Numbers | Company registration numbers |
| Asset Location | Physical location of the leased asset |
| Bank Details | Payment account details |
| Insurance Requirements | Sum insured, TPL coverage, minimum insurer rating |
| Governing Law | Jurisdiction for dispute resolution |
| Arbitration Rules | LCIA, ICC, ICSID, UNCITRAL, etc. |
| Seat of Arbitration | City/country where arbitration takes place |
| Permitted Use | What the lessee is allowed to use the asset for |
| Signatory Titles | Titles of the persons signing for each party |

---

#### Step 5 — Preview & Generate

Generates and displays the full **lease agreement document** as HTML. The user can:
- Read through the generated contract
- Download it as a PDF
- Save the contract to the database

> **Note**: The contract document is generated by `contractGenerator.ts`. It produces a fully formatted legal agreement with all the terms entered in Steps 1-4, including signatures blocks and schedules.

---

### Saving a Contract

When the user clicks **Save**:
- If it's a new contract → `POST /api/contracts` (creates in database with `status: 'draft'`)
- If editing an existing contract → `PUT /api/contracts/{id}` (updates)

The app distinguishes between new and existing contracts by checking the contract ID format: UUID format = database record exists; timestamp-based ID = new contract.

---

## 6. Module 2 — Lease Calculations

**Route**: `/#/calculations`
**File**: `src/pages/LeaseCalculations.tsx`

### Purpose
This is where the **IFRS 16 numbers are generated**. Once a contract exists, this module performs all the accounting calculations required by the standard.

### User Flow

1. **Select a Contract**: A dropdown (`ContractSelector`) shows all saved contracts. Pick one.
2. **Auto-Trigger**: If the contract has all required fields, calculations run automatically.
3. **View Results**: The `ResultsDisplay` component shows everything.

### Required Fields for Calculation

The system checks these before running:
- `ContractID` — must exist
- `CommencementDate` — must exist
- `NonCancellableYears` — must be > 0
- `FixedPaymentPerPeriod` — must be > 0
- `IBR_Annual` — must be set

If any are missing, the system shows the `CalculationEngine` button instead, asking the user to complete the contract first.

---

### What the Results Show

The `ResultsDisplay` component has multiple tabs:

#### Summary Cards (Top of Page)
| Card | What It Shows |
|---|---|
| Initial Lease Liability | Present value of all lease payments at commencement |
| Initial ROU Asset | Liability + IDC + Prepayments − Incentives |
| Total Interest Expense | Sum of all interest over the full lease term |
| Total Depreciation | Sum of all depreciation over the lease term |

#### Tab 1 — Amortisation Schedule
A row-by-row table showing how the **lease liability** reduces over time:

| Column | Meaning |
|---|---|
| Period | Month/Quarter number |
| Date | Calendar date of the period |
| Opening Balance | Liability at start of period |
| Payment | Rent paid this period |
| Interest | Interest portion of payment |
| Principal | Payment minus interest (reduces liability) |
| Closing Balance | Liability at end of period |
| Current Liability | Portion due within 12 months (SOFP split) |
| Non-Current Liability | Portion due after 12 months (SOFP split) |
| Depreciation | ROU asset depreciation this period |
| Remaining ROU Asset | ROU asset after depreciation |

> **SOFP Split Explained**: For the Statement of Financial Position (Balance Sheet), lease liabilities must be split between current (< 1 year) and non-current (> 1 year). The app calculates this automatically by summing the next 12 months' principal repayments.

#### Tab 2 — Cashflow Schedule
Simple table of when payments are made:

| Column | Meaning |
|---|---|
| Period | Period number |
| Date | Payment date |
| Rent | Amount paid |

> Note: If RVG is included, the final period shows the regular payment **plus** the residual value guarantee amount.

#### Tab 3 — Depreciation Schedule
| Column | Meaning |
|---|---|
| Period | Period number |
| Depreciation | Amount of ROU asset depreciated this period |

#### Tab 4 — Journal Entries
Standard double-entry bookkeeping entries generated for:

**At Commencement (Day 1)**:
```
Dr  Right-of-Use Asset        [Initial ROU amount]
Cr  Lease Liability                               [Initial Liability]
Dr  Lease Liability           [Prepayment amount] (if any)
Cr  Cash/Bank                                     [Prepayment amount]
```

**Each Period**:
```
Dr  Interest Expense          [Interest this period]
Cr  Lease Liability                               [Interest this period]

Dr  Lease Liability           [Payment amount]
Cr  Cash/Bank                                     [Payment amount]

Dr  Depreciation Expense      [Depreciation this period]
Cr  Accumulated Depreciation                      [Depreciation this period]
```

#### Export Options
The user can export all results to:
- **CSV** — for Excel analysis
- **PDF** — for audit files and management reports
- **Excel** — formatted spreadsheet

---

## 7. Module 3 — Disclosure & Journals

**Route**: `/#/disclosure-journals`
**File**: `src/pages/DisclosureJournals.tsx`

### Purpose
Generates the **financial statement disclosures** required by IFRS 16. Every company applying IFRS 16 must include specific notes in their annual financial statements. This module produces those notes.

### Three Tabs

#### Tab 1 — Journal Entries
The complete set of journal entries for the selected contract, ready to be posted into an accounting system (ERP, QuickBooks, SAP, etc.).

#### Tab 2 — Key Disclosures
Produces the narrative disclosures required by IFRS 16.47-60, including:
- Lease term and options assessment
- Discount rate used (IBR)
- Carrying amount of ROU assets by class
- Maturity analysis of undiscounted lease payments
- Interest expense, depreciation, and total lease expense
- Judgements and estimates made

#### Tab 3 — Maturity Analysis
IFRS 16 requires a **maturity analysis** of undiscounted lease payments. This breaks down how much cash the company will pay over time:

| Band | Period |
|---|---|
| Less than 1 year | Within 12 months |
| 1 to 5 years | Years 2 through 5 |
| More than 5 years | Beyond year 5 (if applicable) |
| **Total undiscounted** | Sum of all future payments |
| **Effect of discounting** | Difference between undiscounted and PV |
| **Lease liability** | Present value (what's on the balance sheet) |

> **Why This Matters**: Analysts and auditors use the maturity analysis to assess liquidity risk. It shows when cash actually leaves the business.

---

## 8. Module 4 — Approval Dashboard

**Route**: `/#/approvals`
**File**: `src/pages/ApprovalDashboard.tsx`
**Access**: Approvers and Admins only

### Purpose
Implements a **governance and approval workflow** for lease contracts. Before a lease is officially recognised in the financial statements, it should be reviewed and approved by an authorised person.

### Contract Status Lifecycle

```
         Creator             Approver
           │                    │
     [Fills form]               │
           │                    │
     [Saves Draft] ──────────── ┼─── status: "draft"
           │                    │
     [Submits] ─────────────────┼─── status: "pending"
                                │
                       [Starts Review] ──── status: "under_review"
                                │
                    ┌───────────┴───────────┐
                    │                       │
               [Approves] ──────     [Rejects] ──────
               status: "approved"    status: "rejected"
```

### Dashboard Features

**Statistics Cards** (top of page):
- Total contracts pending review
- Contracts currently under review
- Approved contracts count

**Contract Table** (main view):
Each row shows: Contract ID, Lessee, Asset, Commencement Date, Current Status, Actions

**Actions Available**:
| Action | Who Can | When |
|---|---|---|
| Start Review | Approver/Admin | When status = "pending" |
| Approve | Approver/Admin | When status = "under_review" |
| Reject | Approver/Admin | When status = "under_review" |

**Approval Modal**:
When approving or rejecting, a popup appears asking for:
- Notes (optional for approval, required for rejection)
- These notes are stored in the approval history for audit purposes

### Approval History
Every approval action is logged with:
- Who took the action (user ID, email, name)
- When they took it (timestamp)
- What action was taken
- Any notes or rejection reason

This creates a **full audit trail** — important for compliance and external audits.

---

## 9. Module 5 — Dashboard (Portfolio Analytics)

**Route**: `/#/dashboard`
**File**: `src/pages/Dashboard.tsx`

### Purpose
Gives a **birds-eye view** of the entire lease portfolio — all contracts combined.

### How It Works
The dashboard automatically runs `calculateIFRS16()` for every saved contract that has sufficient data. The results are aggregated to produce portfolio-level metrics.

### Key Metrics Displayed

| Metric | How Calculated |
|---|---|
| Total ROU Assets | Sum of `initialROU` across all contracts |
| Total Lease Liabilities | Sum of `initialLiability` across all contracts |
| Monthly Depreciation | Average `depreciation` from current-period rows |
| Monthly Interest | Average `interest` from current-period rows |
| Total Contracts | Count of saved contracts |
| Expiring Soon | Contracts ending within the next 6 months |

### Visualisations
- **Portfolio Composition**: Pie/donut chart of assets by class (Property, Vehicle, IT, etc.)
- **Monthly Trends**: Line/bar chart showing liability, asset, and depreciation over time
- **Upcoming Maturities**: Which leases are ending soon

---

## 10. The IFRS 16 Calculation Engine — Deep Dive

**File**: `src/utils/ifrs16Calculator.ts`

This is the **mathematical heart** of the application. Everything else in the app is presentation — this file does the actual accounting work.

### Entry Point

```typescript
calculateIFRS16(leaseData) → CalculationResults
```

If the lease has been modified, it routes to `calculateWithModification()`. Otherwise it runs `calculateStandardLease()`.

---

### Step 1: Determine the Lease Term (IFRS 16.18-19)

The lease term is not always the non-cancellable period. It depends on options:

```
IF termination option exists AND likelihood ≥ 50%:
    Lease term = Years until termination point
    (the lessee expects to exit early)

ELSE IF renewal option exists AND likelihood ≥ 50%:
    Lease term = Non-cancellable years + Renewal option years
    (the lessee expects to renew)

ELSE:
    Lease term = Non-cancellable years only
```

**Why 50%?** The IFRS 16 threshold is "reasonably certain." The app uses 50% as its operational interpretation — if it's more likely than not that the option will be exercised, it's included.

**Periods Calculation**:
```
periodsPerYear:
  Monthly → 12
  Quarterly → 4
  Semiannual → 2
  Annual → 1

totalPeriods = leaseTermYears × periodsPerYear
```

---

### Step 2: Calculate the Lease Liability (IFRS 16.26)

The lease liability is the **present value** of all future lease payments.

**What Counts as a Lease Payment**:
1. `FixedPaymentPerPeriod` — the base rent
2. `VariablePaymentsInSubstanceFixed` — variable in form, but certain in substance
3. `RVGExpected` — if `RVGReasonablyCertain = true`
4. `PurchaseOptionPrice` — if `PurchaseOptionReasonablyCertain = true`
5. `TerminationPenaltyExpected` — if termination is included in the lease term

**The Discount Rate**:
```
IBR_Annual = 0.14 (14% per year)

ratePerPeriod = (1 + 0.14)^(1/12) − 1
             = (1.14)^(1/12) − 1
             ≈ 0.01099 (about 1.1% per month)
```

This converts the annual rate into a per-period rate using **compound interest** principles.

**The Present Value Formula**:
For each payment period `i`:
```
Discount Factor (Arrears) = 1 / (1 + rate)^i
Discount Factor (Advance) = 1 / (1 + rate)^(i-1)

PV of Payment = Payment Amount × Discount Factor
```

Then all the individual PVs are summed:
```
Lease Liability = Σ PV(payment₁) + PV(payment₂) + ... + PV(paymentₙ)
```

**Special Case — Advance Payment with Prepayment**:
If `PaymentTiming = "Advance"` AND `PrepaymentsBeforeCommencement > 0`:
- The first period's payment is excluded from the PV calculation (it was already paid before commencement)
- Period 1 through 59 are discounted (not 1 through 60)

This reflects that the lessee has already handed over the first payment, so it shouldn't be discounted — it's already a cash outflow.

---

### Step 3: Sale-Leaseback Adjustment

This only applies to **sale-leaseback** transactions, where a company sells an asset and immediately leases it back.

```
IF FairValue > 0 AND SalesProceeds > 0:

  IF SalesProceeds < FairValue:
    → Sale at a loss: Reduce liability
    → Liability -= (FairValue − SalesProceeds)

  IF SalesProceeds > FairValue:
    → Sale at a premium: Increase liability
    → Liability += (SalesProceeds − FairValue)
```

**Why?** IFRS 16 requires that in a sale-leaseback, the seller/lessee only recognises a gain for the portion of the asset they no longer control. If the sale price is below fair value, effectively the lessee is paying more rent to compensate — the extra liability captures this.

---

### Step 4: Calculate the Initial ROU Asset (IFRS 16.24)

**Standard Lease**:
```
ROU Asset = Lease Liability
          + InitialDirectCosts
          + PrepaymentsBeforeCommencement
          − LeaseIncentives
```

**Sale-Leaseback**:
```
ROU Asset = (Lease Liability / Fair Value) × Carrying Amount
```

This proportional formula recognises only the portion of the original asset that the seller-lessee retains through the lease.

---

### Step 5: Build the Amortisation Schedule

This is the most detailed part — a row-by-row table for every period of the lease.

**For each period from 1 to totalPeriods**:

```
Opening Liability = Previous period's closing liability
                    (Period 1: Opening = Initial Lease Liability)

Interest Expense = Opening Liability × Rate Per Period

Principal Repaid = Payment − Interest Expense

Closing Liability = Opening Liability − Principal Repaid

Depreciation = Initial ROU Asset ÷ Total Periods

Remaining Asset = Previous Asset − Depreciation
```

**SOFP Liability Split** (calculated for each period):
```
Current Liability = Sum of principal repayments in next 12 periods
Non-Current Liability = Closing Liability − Current Liability
```

This split is important because IFRS requires lease liabilities to be presented separately as current and non-current on the Statement of Financial Position (Balance Sheet).

**Handling Special Cases**:
- **Prepayment (Advance + Prepaid)**: Period 1 has zero payment (the first payment was prepaid before commencement). From period 2 onwards, normal payments.
- **RVG in Final Period**: The second-to-last period includes both the regular payment AND the residual value guarantee amount.
- **Final Period**: Usually zero payment — a placeholder row to complete the schedule.

---

### Step 6: Generate Other Schedules

**Cashflow Schedule**: Simply the date and rent amount for each period. Dates are calculated by adding periods to the commencement date.

**Depreciation Schedule**: Just the depreciation amount per period (a simpler view of the amortisation data).

**Journal Entries**: The app generates representative journal entries:
- Commencement day entries (initial recognition)
- First period entries (interest, payment, depreciation)

In practice, users would replicate the pattern for every period when posting to their ERP system.

---

## 11. Lease Modifications (Amendments)

**File**: `src/utils/leaseModificationCalculator.ts`

### What Is a Lease Modification?

Under IFRS 16.44, a **lease modification** is a change to the scope or consideration of a lease that was not part of the original terms. Examples:
- Extending the lease term
- Reducing the leased area
- Changing the rental amount

When a modification occurs, the lessee must **remeasure the lease liability** at the modification date using revised terms and (if changed) a revised discount rate.

### How the App Handles Modifications

#### User Flow

1. User goes to the Contract List tab
2. Selects "Modify" on an existing contract
3. `ModifyContractModal` opens, asking for:
   - **Effective Date**: When does the modification take effect?
   - **Changed Values**: New payment amount? New term? New IBR?
   - **Reason**: Why was the modification made?
   - **Modification Type**: Amendment, termination, extension, etc.
   - **Agreement Date**: When did both parties sign the amendment?
4. The app calculates the modified lease
5. A **new version** of the contract is created

#### The Calculation (7 Steps)

**Step 1 — Find the Modification Period**:
```
yearsElapsed = (modificationDate − commencementDate) ÷ 365.25
periodsElapsed = floor(yearsElapsed × periodsPerYear)
modificationPeriod = periodsElapsed + 1
```

**Step 2 — Merge Lease Data**:
Combine original terms with new values. However, these fields are never changed:
- `ContractID` — always stays the same
- `CommencementDate` — the original start date is a historical fact
- `ContractDate` — original signing date is preserved

**Step 3 — Calculate Remaining Term**:
```
remainingYears = originalLeaseTermYears − yearsElapsed
```
Or, if the modification extends the lease, the new term replaces this.

**Step 4 — Set Up Forward Calculation**:
Create a temporary lease data object with:
- New payment amounts (if changed)
- New IBR (if changed)
- Remaining term (not original term)
- Zero initial costs (IDC, prepayments, incentives don't apply at modification)
- Commencement date = modification date (for period numbering)

**Step 5 — Run IFRS 16 on Remaining Periods**:
The standard `calculateIFRS16()` function runs on just the forward data.

**Step 6 — Merge Preserved and New Schedules**:
```
Full Schedule = [original periods 1 → modificationPeriod]
              + [new periods modificationPeriod+1 → end]
```
Period numbers continue without break (no gaps, no restarts).

**Step 7 — Recalculate Totals**:
```
totalInterest = sum of interest across merged schedule
totalDepreciation = sum of depreciation across merged schedule
```

#### Version Management

Each modification creates a new SavedContract record:
```
Original:      contractId = "contract-123"       version = 1
Amendment 1:   contractId = "contract-123-v2"    version = 2
Amendment 2:   contractId = "contract-123-v3"    version = 3
```

The `baseContractId` field links all versions to the original. Previous versions are marked `isActive = false`. This enables full version history for audit purposes.

---

## 12. The Lease Agreement Generator

**File**: `src/utils/contractGenerator.ts`

### Purpose
Generates a **formal legal lease agreement** in HTML format based on all the data entered in the contract wizard. This document can be downloaded as PDF or printed.

### Two Modes

**FULL Mode** (the only active mode in this app):
Produces a comprehensive legal agreement with 5 sections:
1. **Cover / Header** — Parties, reference number, date
2. **Schedule 1: Key Commercial Terms** — All the financial and operational details in a table
3. **Schedule 2: Full Lease Agreement** — 17 clauses covering all legal terms
4. **Schedule 4: Acceptance Certificate** — Template for asset delivery confirmation
5. **Schedule 5: ESG & Compliance Undertakings** — Environmental and governance commitments

**The 17 Legal Clauses** cover:
1. Parties and Definitions
2. Lease and Title
3. Delivery, Commissioning and Acceptance
4. Rent, Payment Mechanics, Escalation
5. Taxes, Withholding, Gross-Up
6. Use, Maintenance, Relocation, Software
7. Insurance
8. Compliance Undertakings
9. Events of Default, Remedies
10. Risk, Loss and Damage
11. Assignment and Sub-leasing
12. Data, Metering, Audit Rights
13. Force Majeure
14. Dispute Resolution, Governing Law
15. Notices
16. Entire Agreement, Variation, Severability
17. Signatures

### Dynamic Content
The generator uses the lease data to populate the document:
- Party names and addresses in legal clauses
- Payment amounts, frequencies, and escalation terms in Schedule 1
- Renewal and termination option details
- Currency throughout the document
- Signature blocks with the correct signatory titles

---

## 13. User Roles and Access Control

**File**: `src/context/AuthContext.tsx` and `src/components/Auth/ProtectedRoute.tsx`

### Authentication

The app uses **Supabase** for authentication. Supabase is a backend-as-a-service platform that provides:
- User registration and login
- Session management (JWT tokens)
- A PostgreSQL database with Row-Level Security

When a user logs in, Supabase returns a session token. Every API call includes this token in the `Authorization` header so the backend knows who is making the request.

### The Three Roles

| Role | What They Can Do |
|---|---|
| `creator` | Create contracts, edit their own contracts, submit for approval, run calculations |
| `approver` | Everything a creator can do, plus: review, approve, reject contracts in the approval dashboard |
| `admin` | Full access to everything, including user management |

### How Access Control Works

**Route Level** (`ProtectedRoute.tsx`):
The `ApprovalDashboard` route requires `requiredRoles: ['approver', 'admin']`. If a creator tries to navigate to `/#/approvals`, they are redirected to the home page.

**UI Level**:
Buttons like "Start Review" and "Approve" are only rendered if the logged-in user has the `approver` or `admin` role.

### Row-Level Security (Database Level)
The SQL files in `backend/migrations/` set up **Row-Level Security (RLS)** in Supabase. This means:
- Users can only see their own contracts (unless they're admins)
- Approvers can see contracts submitted for review
- No user can view another user's private contracts, even by manipulating API calls

---

## 14. Global State Management

**File**: `src/context/LeaseContext.tsx`

### Why Global State?

The lease data needs to be accessible across many different components and pages. For example:
- The form on `/contract` collects the data
- The calculation on `/calculations` uses it
- The disclosure on `/disclosure-journals` uses the results

Passing data as props between every component would be unwieldy. Instead, the app uses **React Context** with `useReducer` — a pattern similar to Redux.

### The State Object

```typescript
LeaseState = {
  leaseData: Partial<LeaseData>;       // All current contract fields
  mode: 'MINIMAL' | 'FULL';            // Application mode
  calculations: CalculationResults;    // Results from ifrs16Calculator
  contractHtml: string;                // Generated HTML contract
  savedContracts: SavedContract[];     // All user's contracts from database
  loading: boolean;                    // For spinner/loading indicators
  error: string | null;                // Error messages
}
```

### How State Changes Work (Actions)

Instead of directly modifying state, the app dispatches **actions** — descriptions of what should change. The **reducer** function handles each action:

| Action | What It Does |
|---|---|
| `SET_LEASE_DATA` | Merge new fields into leaseData (partial update) |
| `SET_MODE` | Switch between MINIMAL and FULL |
| `SET_CALCULATIONS` | Store calculation results after running calculateIFRS16 |
| `SET_CONTRACT_HTML` | Store the generated contract HTML |
| `SAVE_CONTRACT` | Add a new contract to savedContracts array |
| `UPDATE_CONTRACT` | Update an existing contract in the array |
| `DELETE_CONTRACT` | Remove a contract from the array |
| `LOAD_CONTRACT` | Copy a saved contract into the active editing state |
| `LOAD_ALL_CONTRACTS` | Replace the entire savedContracts array (on page load) |
| `CREATE_MODIFICATION` | Add a new version while marking previous as inactive |
| `SET_LOADING` | Toggle the loading indicator |
| `SET_ERROR` | Set or clear an error message |
| `RESET` | Clear everything back to initial state |

### How Components Access State

Any component can "subscribe" to the global state:
```typescript
const { state, dispatch } = useLeaseContext();
// state.leaseData, state.calculations, etc. are all available
// dispatch({ type: 'SET_LEASE_DATA', payload: { Currency: 'USD' } })
```

---

## 15. Data Flow: End-to-End User Journey

Here is the complete journey of a lease from creation to financial statements:

```
User signs up / logs in
        │
        ▼
Navigate to /#/contract
        │
        ▼
Complete 5-step wizard
  Step 1: Basic Info         → Updates LeaseContext.leaseData
  Step 2: Payment Details    → Updates LeaseContext.leaseData
  Step 3: Advanced Options   → Updates LeaseContext.leaseData
  Step 4: Legal & Admin      → Updates LeaseContext.leaseData
  Step 5: Preview & Save     → Calls contractGenerator.ts
                               Dispatches SAVE_CONTRACT
                               POSTs to /api/contracts
        │
        ▼
Contract is saved (status: "draft")
        │
        ▼
User clicks "Submit for Approval"
  → API call: PUT /api/contracts/{id}
  → Status changes to "pending"
        │
        ▼
Approver logs in → /#/approvals
  → Sees pending contract
  → Clicks "Start Review" → status: "under_review"
  → Reviews contract details
  → Clicks "Approve" → status: "approved"
        │
        ▼
User goes to /#/calculations
  → Selects the approved contract
  → calculateIFRS16() runs
  → Amortisation, depreciation, journal entries generated
  → Dispatches SET_CALCULATIONS
  → ResultsDisplay shows all schedules
        │
        ▼
User goes to /#/disclosure-journals
  → Selects the same contract
  → Journal entries displayed for ERP posting
  → Maturity analysis generated for financial statement note
  → User exports or copies data
        │
        ▼
Financial statements are prepared with:
  - ROU Asset on Balance Sheet (initial ROU − accumulated depreciation)
  - Lease Liability on Balance Sheet (current + non-current split)
  - Interest expense in Income Statement
  - Depreciation expense in Income Statement
  - Maturity analysis in Notes to Financial Statements
```

---

## 16. Glossary of Terms

| Term | Definition |
|---|---|
| **IFRS 16** | International Financial Reporting Standard 16 — the accounting standard governing lease accounting for lessees |
| **Lessee** | The party who uses (rents) the asset |
| **Lessor** | The party who owns and rents out the asset |
| **Lease Liability** | The present value of future lease payments — recognised on the balance sheet |
| **ROU Asset** | Right-of-Use Asset — the lessee's right to use the leased asset, recognised on the balance sheet |
| **IBR** | Incremental Borrowing Rate — the interest rate the lessee would pay to borrow funds to buy a similar asset |
| **Present Value (PV)** | The current worth of a future sum of money, given a specified rate of return |
| **Discount Rate** | The rate used to convert future payments to present value (here: IBR) |
| **Effective Interest Method** | A method of allocating interest expense over a loan's life so that the rate remains constant |
| **Straight-Line Depreciation** | Spreading the cost of an asset evenly over its useful life |
| **Amortisation** | Systematic reduction of the lease liability over time (analogous to loan repayment) |
| **SOFP** | Statement of Financial Position — the formal name for the Balance Sheet |
| **P&L** | Profit and Loss Statement — the Income Statement |
| **IDC** | Initial Direct Costs — costs incurred to secure a lease (legal fees, commissions) |
| **RVG** | Residual Value Guarantee — lessee's guarantee of the asset's value at lease end |
| **Advance Payment** | Payment made at the start of a period (before using the asset) |
| **Arrears Payment** | Payment made at the end of a period (after using the asset) |
| **Lease Modification** | A change to lease terms not part of the original contract (IFRS 16.44-46) |
| **Remeasurement** | Recalculating the lease liability at a specific date with revised terms |
| **Commencement Date** | The date on which the lessee obtains the right to use the leased asset |
| **Non-Cancellable Period** | The period the lessee is obligated to pay rent regardless |
| **Renewal Option** | A right (but not obligation) to extend the lease |
| **Termination Option** | A right to end the lease before the non-cancellable period expires |
| **Reasonably Certain** | The IFRS 16 threshold for including options in the lease term (~50%+ likelihood) |
| **Sale-Leaseback** | A transaction where an asset is sold and immediately leased back by the original owner |
| **CPI** | Consumer Price Index — a measure of inflation, used for CPI-linked rent escalation |
| **Maturity Analysis** | A breakdown of future undiscounted cash payments by time band |
| **Audit Trail** | A chronological record of actions taken, used to verify compliance |
| **Row-Level Security (RLS)** | A database security feature that restricts data access per user |
| **JWT** | JSON Web Token — a secure way to transmit authentication information |
| **HashRouter** | A React routing mode that uses the URL `#` fragment to manage page navigation |

---

*This document covers the IFRS 16 Lease Engine as at the time of writing. For specific accounting guidance, refer to the full text of IFRS 16 published by the IASB.*
