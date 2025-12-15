export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TopicContent {
  title: string;
  content: string;
  keyPoints: string[];
  example?: string;
}

export interface ModuleContent {
  moduleId: number;
  topics: TopicContent[];
  quiz: Question[];
}

export const educationContent: ModuleContent[] = [
  // Module 1: IFRS 16 Fundamentals
  {
    moduleId: 1,
    topics: [
      {
        title: "Scope & Exemptions",
        content: "IFRS 16 applies to all leases, including subleases, except for specific exemptions. The standard requires lessees to recognize assets and liabilities for most leases, bringing them onto the balance sheet.",
        keyPoints: [
          "IFRS 16 applies to all leases unless specifically exempted",
          "Short-term leases (12 months or less) can be exempted",
          "Low-value asset leases (e.g., laptops, phones) can be exempted",
          "Leases of intangible assets are excluded from scope",
          "Service contracts are not leases and are excluded",
          "Lessees must assess whether contracts contain a lease"
        ],
        example: "Example: A company leases office equipment for 10 months. Since this is a short-term lease (≤12 months), the company can elect to expense the lease payments rather than recognize a right-of-use asset and liability."
      },
      {
        title: "Lease Definitions",
        content: "A lease is a contract that conveys the right to control the use of an identified asset for a period of time in exchange for consideration. Control requires both the right to obtain substantially all economic benefits and the right to direct the use of the asset.",
        keyPoints: [
          "Identified asset: Physically distinct or capacity portion",
          "Right to obtain substantially all economic benefits",
          "Right to direct how and for what purpose the asset is used",
          "Supplier substitution rights can prevent lease classification",
          "Embedded leases within service contracts must be identified",
          "Assessment is made at inception of the contract"
        ],
        example: "Example: A company contracts to use 3 floors of a 20-floor building. The 3 floors are physically distinct and identified in the contract. The company has the right to decide how to use the space (offices, storage, etc.), giving them control. This is a lease."
      },
      {
        title: "Initial Recognition",
        content: "At the commencement date, a lessee recognizes a right-of-use (ROU) asset and a lease liability. The lease liability is measured at the present value of lease payments, and the ROU asset includes the liability amount plus initial direct costs and prepayments.",
        keyPoints: [
          "Recognition occurs at the commencement date (when asset is available)",
          "Lease liability = PV of future lease payments",
          "ROU asset = Lease liability + Initial direct costs + Prepayments - Incentives",
          "Discount rate: Incremental borrowing rate (IBR) if implicit rate unknown",
          "Initial direct costs are capitalized to the ROU asset",
          "Lease incentives reduce the ROU asset value"
        ],
        example: "Example: Annual lease payment of $100,000 for 5 years, IBR of 5%. Lease liability = $432,948 (PV of payments). If initial direct costs are $10,000, ROU asset = $442,948."
      },
      {
        title: "Subsequent Measurement",
        content: "After initial recognition, the lease liability is measured using the effective interest method, and the ROU asset is depreciated on a straight-line basis (unless another basis is more appropriate). Interest expense and depreciation are recognized separately in the P&L.",
        keyPoints: [
          "Lease liability: Increased by interest, decreased by payments",
          "Interest expense calculated using effective interest method",
          "ROU asset: Depreciated over the shorter of lease term or useful life",
          "Depreciation typically on a straight-line basis",
          "Remeasurements required for changes in lease term or payments",
          "Interest + Depreciation typically exceeds cash rent in early years"
        ],
        example: "Example: Year 1 interest on $432,948 liability at 5% = $21,647. After $100,000 payment, liability = $354,595. ROU depreciation = $442,948 / 5 = $88,590. Total P&L = $110,237 vs. $100,000 cash rent."
      },
      {
        title: "Disclosures",
        content: "IFRS 16 requires extensive disclosures to help users understand the nature, amount, timing, and uncertainty of cash flows arising from leases. This includes maturity analysis, expense analysis, and qualitative information about leasing activities.",
        keyPoints: [
          "Maturity analysis of lease liabilities showing undiscounted cash flows",
          "Carrying amounts of ROU assets by class of underlying asset",
          "Depreciation, interest expense, and expense for short-term/low-value leases",
          "Additions to ROU assets and gains/losses from sale and leaseback",
          "Total cash outflow for leases",
          "Significant judgments in determining lease term and discount rate",
          "Restrictions or covenants imposed by leases"
        ],
        example: "Example disclosure: 'The company has lease commitments for office buildings and equipment. The weighted average lease term is 4.2 years, and the weighted average discount rate is 4.8%. Total undiscounted lease commitments are $2.5M.'"
      }
    ],
    quiz: [
      {
        id: 1,
        question: "Which of the following leases is NOT eligible for the short-term lease exemption under IFRS 16?",
        options: [
          "A 10-month lease of office equipment with no purchase option",
          "A 12-month lease of warehouse space with a 5-year renewal option",
          "An 8-month lease of vehicles",
          "A 6-month lease of IT equipment"
        ],
        correctAnswer: 1,
        explanation: "A lease with a renewal option that the lessee is reasonably certain to exercise extends the lease term beyond 12 months, making it ineligible for the short-term lease exemption."
      },
      {
        id: 2,
        question: "What is the key factor that distinguishes a lease from a service contract?",
        options: [
          "The length of the contract",
          "The right to control the use of an identified asset",
          "The payment structure",
          "Whether maintenance is included"
        ],
        correctAnswer: 1,
        explanation: "A lease conveys the right to control the use of an identified asset. Service contracts do not transfer control of an asset to the customer."
      },
      {
        id: 3,
        question: "The right-of-use asset at initial recognition equals:",
        options: [
          "Present value of lease payments only",
          "Total undiscounted lease payments",
          "Lease liability + Initial direct costs + Prepayments - Incentives",
          "Lease liability only"
        ],
        correctAnswer: 2,
        explanation: "The ROU asset includes the lease liability amount, plus any initial direct costs and prepayments, minus any lease incentives received."
      },
      {
        id: 4,
        question: "In the early years of a lease, the combined expense (interest + depreciation) compared to the lease payment is typically:",
        options: [
          "Lower than the lease payment",
          "Equal to the lease payment",
          "Higher than the lease payment",
          "It varies randomly"
        ],
        correctAnswer: 2,
        explanation: "In early years, interest expense is higher (on the larger liability balance), making the combined expense of interest plus straight-line depreciation exceed the lease payment. This reverses in later years."
      },
      {
        id: 5,
        question: "Which discount rate should be used when the rate implicit in the lease cannot be readily determined?",
        options: [
          "The lessee's cost of equity",
          "The lessee's weighted average cost of capital (WACC)",
          "The lessee's incremental borrowing rate (IBR)",
          "The risk-free rate"
        ],
        correctAnswer: 2,
        explanation: "IFRS 16 requires the use of the incremental borrowing rate (IBR) when the rate implicit in the lease cannot be readily determined. The IBR is the rate the lessee would pay to borrow funds to purchase a similar asset."
      }
    ]
  },

  // Module 2: Lease Data Intake & Contract Interpretation
  {
    moduleId: 2,
    topics: [
      {
        title: "Lease vs Non-Lease Components",
        content: "Contracts often bundle lease and non-lease components (e.g., equipment lease with maintenance). IFRS 16 requires separation of components and allocation of consideration based on relative stand-alone prices, unless the practical expedient is elected.",
        keyPoints: [
          "Lease component: Right to use the underlying asset",
          "Non-lease component: Services or other rights (e.g., maintenance)",
          "Must separate components unless practical expedient elected",
          "Practical expedient: Account for lease and non-lease as single component",
          "Allocation based on relative stand-alone prices",
          "Common non-lease components: CAM charges, maintenance, utilities",
          "Separation impacts measurement of lease liability"
        ],
        example: "Example: Office lease of $120,000/year includes $100,000 for space and $20,000 for cleaning services. If stand-alone prices are $110,000 and $22,000, allocate total payment as: Space = $120k × ($110k/$132k) = $100k, Service = $20k."
      },
      {
        title: "Lease Term Determination",
        content: "The lease term includes the non-cancellable period plus periods covered by extension options that the lessee is reasonably certain to exercise, and termination options the lessee is reasonably certain not to exercise.",
        keyPoints: [
          "Non-cancellable period is the foundation",
          "Include extension periods if reasonably certain to exercise",
          "Exclude termination periods if reasonably certain to terminate",
          "'Reasonably certain' requires significant judgment",
          "Consider economic incentives to extend (e.g., leasehold improvements)",
          "Penalties for termination affect the assessment",
          "Market conditions and business strategy are relevant",
          "Reassess when significant events occur"
        ],
        example: "Example: 5-year lease with option to extend 3 years. Lessee has invested $500k in leasehold improvements with 8-year life. Extension is reasonably certain due to economic incentive. Lease term = 8 years."
      },
      {
        title: "Payment Classification",
        content: "Lease payments include fixed payments, variable payments based on an index/rate, amounts expected under residual value guarantees, purchase options reasonably certain to exercise, and termination penalties if reflected in the lease term.",
        keyPoints: [
          "Fixed payments: Include in-substance fixed payments",
          "Variable payments: Only if based on index or rate (e.g., CPI)",
          "Variable payments based on usage/performance excluded from liability",
          "Residual value guarantees: Include expected payment amount",
          "Purchase option: Include if reasonably certain to exercise",
          "Termination penalties: Include if term reflects termination",
          "Initial direct costs: Incremental costs to obtain the lease",
          "Lease incentives: Reduce the ROU asset"
        ],
        example: "Example: Base rent $100k/year + $20k contingent on sales targets + CPI adjustment starting at 2%. Include: $100k base + $2k CPI ($100k × 2%). Exclude: $20k sales-based payment (recognized as incurred)."
      },
      {
        title: "Initial Direct Costs & Incentives",
        content: "Initial direct costs are incremental costs that would not have been incurred if the lease had not been obtained. Lease incentives are payments made by the lessor to the lessee, or reimbursement of costs incurred by the lessee.",
        keyPoints: [
          "IDC examples: Commissions to brokers, legal fees for lease",
          "NOT IDC: Internal costs, costs that would be incurred anyway",
          "Capitalize IDC to the ROU asset (increase asset)",
          "Lease incentives: Cash payments or rent-free periods",
          "Incentives reduce the ROU asset at commencement",
          "Tenant improvement allowances are lease incentives",
          "Timing: IDC when incurred, incentives at commencement",
          "Both affect the ROU asset, not the lease liability directly"
        ],
        example: "Example: Lessor pays $50k to lessee for tenant improvements. Lessee incurs $20k in broker commissions. ROU asset adjustment: +$20k (IDC) - $50k (incentive) = -$30k net reduction from base liability amount."
      },
      {
        title: "Common Pitfalls",
        content: "Several common errors occur in lease accounting, including misclassifying service components as lease payments, incorrect lease term assessments, and failing to identify embedded leases in service contracts.",
        keyPoints: [
          "Pitfall 1: Not separating service components from lease",
          "Pitfall 2: Underestimating lease term (missing extension options)",
          "Pitfall 3: Including all variable payments in liability",
          "Pitfall 4: Treating internal costs as initial direct costs",
          "Pitfall 5: Missing embedded leases in outsourcing contracts",
          "Pitfall 6: Using wrong discount rate (WACC instead of IBR)",
          "Pitfall 7: Not reassessing lease term when circumstances change",
          "Pitfall 8: Forgetting to reduce ROU for lease incentives"
        ],
        example: "Example of pitfall: Company includes $30k annual maintenance fee in lease payments, overstating liability by $130k (PV of 5 years at 5%). Maintenance should be expensed separately as a service."
      }
    ],
    quiz: [
      {
        id: 1,
        question: "A lease contract includes equipment rental ($80,000/year) and equipment maintenance ($20,000/year). If the practical expedient is NOT elected, how should this be accounted for?",
        options: [
          "Recognize entire $100,000 as lease payments",
          "Separate: $80,000 to lease liability, $20,000 expensed as incurred",
          "Recognize only $80,000 as lease payments",
          "Allocate based on relative fair values"
        ],
        correctAnswer: 3,
        explanation: "Without the practical expedient, lease and non-lease components must be separated and allocated based on relative stand-alone prices (similar to fair values)."
      },
      {
        id: 2,
        question: "Which factor would MOST likely indicate that a lessee is reasonably certain to exercise a lease extension option?",
        options: [
          "The extension has the same rent as the initial term",
          "The lessee has made significant leasehold improvements",
          "The lessor wants the lessee to extend",
          "Market rents have decreased"
        ],
        correctAnswer: 1,
        explanation: "Significant leasehold improvements with useful lives extending into the option period create an economic incentive to extend the lease, making extension reasonably certain."
      },
      {
        id: 3,
        question: "Which of the following is NOT included in the initial measurement of the lease liability?",
        options: [
          "Fixed monthly rent payments",
          "Variable payments based on CPI adjustments",
          "Variable payments based on percentage of sales",
          "Termination penalty if lease term reflects termination"
        ],
        correctAnswer: 2,
        explanation: "Variable payments based on performance or use (like percentage of sales) are excluded from lease liability and expensed as incurred. Only variable payments based on an index or rate are included."
      },
      {
        id: 4,
        question: "A lessor provides a $100,000 tenant improvement allowance. How does this affect the lessee's accounting at commencement?",
        options: [
          "Increases the lease liability by $100,000",
          "Decreases the ROU asset by $100,000",
          "Increases the ROU asset by $100,000",
          "Has no effect on initial recognition"
        ],
        correctAnswer: 1,
        explanation: "Lease incentives reduce the right-of-use asset at commencement. The tenant improvement allowance of $100,000 would decrease the ROU asset."
      },
      {
        id: 5,
        question: "Which of the following would qualify as an initial direct cost?",
        options: [
          "Internal staff time reviewing the lease",
          "Commission paid to a leasing broker",
          "General legal fees for all contracts",
          "Costs to negotiate a lease that was not executed"
        ],
        correctAnswer: 1,
        explanation: "Initial direct costs must be incremental costs that would not have been incurred if the lease had not been obtained. Broker commissions qualify. Internal costs and costs for unsuccessful leases do not."
      }
    ]
  },

  // Module 3: Liability & ROU Modelling
  {
    moduleId: 3,
    topics: [
      {
        title: "Cashflow Schedules",
        content: "Creating an accurate cashflow schedule is fundamental to lease accounting. The schedule maps all lease payments over the lease term, identifying the timing, amount, and nature of each payment for proper present value calculation.",
        keyPoints: [
          "List all payment dates across the entire lease term",
          "Include fixed payments, index-based amounts, and probable payments",
          "Exclude variable payments not based on index/rate",
          "Consider payment frequency (monthly, quarterly, annual)",
          "Account for payment timing (advance vs. arrears)",
          "Include residual value guarantees if probable",
          "Map extension periods if reasonably certain",
          "Update schedule when remeasurement events occur"
        ],
        example: "Example: 5-year lease, $10,000/month paid in advance starting Jan 1. Schedule shows 60 payments: Payment 1 at commencement (Day 0), Payments 2-60 at start of months 2-60. Total undiscounted = $600,000."
      },
      {
        title: "Discount Rate Application",
        content: "The discount rate converts future lease payments to present value. Use the rate implicit in the lease if readily determinable; otherwise, use the incremental borrowing rate (IBR). The rate must reflect the lease term and currency.",
        keyPoints: [
          "Rate implicit in lease = Rate that makes PV of payments + residual = fair value",
          "IBR = Rate to borrow to buy similar asset in similar economic environment",
          "IBR should reflect lease term, currency, and lessee's credit",
          "Secured rate more appropriate than unsecured",
          "Consider observable borrowing rates as starting point",
          "Adjust for lease-specific factors (term, collateral, currency)",
          "Single rate for entire lease (no different rates per period)",
          "Rate locked at commencement (not updated unless remeasurement)"
        ],
        example: "Example: 5-year USD lease. Lessee's 5-year term loan rate is 6%. Similar asset lease IBR is 5.5%. Use 5.5% as it better reflects the lease characteristics. PV of $100k/year = $432,948."
      },
      {
        title: "Initial Measurement",
        content: "Initial measurement establishes the opening balance sheet impact. Calculate the present value of all lease payments using the appropriate discount rate, then add initial direct costs and prepayments while subtracting lease incentives to determine the ROU asset.",
        keyPoints: [
          "Step 1: Identify all lease payments to include",
          "Step 2: Determine the appropriate discount rate",
          "Step 3: Calculate PV of lease payments = Lease liability",
          "Step 4: ROU asset = Liability + IDC + Prepayments - Incentives",
          "Commencement date = When asset is available for use",
          "Payments made at/before commencement reduce liability",
          "Use beginning of period discounting for payments in advance",
          "Both asset and liability recognized on balance sheet"
        ],
        example: "Example: 4-year lease, $120k/year in advance, IBR 6%, IDC $15k, incentive $30k. Liability = $120k + $120k/1.06 + $120k/1.06² + $120k/1.06³ = $451,524. ROU = $451,524 + $15k - $30k = $436,524."
      },
      {
        title: "Remeasurements",
        content: "Remeasurement is required when there are changes to lease payments, the lease term, or the assessment of purchase options. The liability is remeasured using a revised discount rate (for term changes) or the original rate (for payment changes).",
        keyPoints: [
          "Trigger 1: Change in lease term assessment (extension/termination)",
          "Trigger 2: Change in purchase option assessment",
          "Trigger 3: Change in amounts under residual value guarantee",
          "Trigger 4: Change in future payments due to index/rate (CPI)",
          "Lease term change: Use revised discount rate at remeasurement date",
          "Payment change only: Use original discount rate",
          "Adjust ROU asset for remeasurement amount (not P&L)",
          "Exception: If ROU reduced to zero, recognize remaining in P&L"
        ],
        example: "Example: Year 3, lessee now reasonably certain to exercise 2-year extension. Original: 5 years at 5%. Remeasure for 7 years total using current 3-year IBR of 6%. Recalculate PV of remaining 5 payments at 6%. Adjust ROU asset for change."
      },
      {
        title: "Worked Examples",
        content: "Practical application through comprehensive examples demonstrates the calculation mechanics, including payment schedules, present value calculations, amortization tables, and journal entries over multiple periods.",
        keyPoints: [
          "Example includes: Initial recognition, Year 1-2 entries, remeasurement",
          "Build complete amortization table: Payment, Interest, Principal, Balance",
          "Interest = Opening liability × Discount rate",
          "Principal reduction = Payment - Interest",
          "Depreciation = (ROU asset - Residual) / Useful life",
          "Show balance sheet impact period by period",
          "Demonstrate difference between cash and P&L impact",
          "Include lease modification scenario"
        ],
        example: "Year 1: Liability $432,948, Payment $100,000, Interest $21,647 (5%), Principal $78,353, Ending liability $354,595. Depreciation $86,590 (straight-line over 5 years). Total P&L $108,237. Cash outflow $100,000. Difference creates timing difference."
      }
    ],
    quiz: [
      {
        id: 1,
        question: "A lease requires annual payments of $50,000 in advance for 4 years. Using a 7% discount rate, what is the initial lease liability?",
        options: [
          "$169,541",
          "$181,368",
          "$200,000",
          "$168,135"
        ],
        correctAnswer: 1,
        explanation: "For payments in advance (annuity due): PV = $50,000 × (1 + [(1 - 1/1.07³) / 0.07]) = $50,000 × 3.62743 = $181,372 (approximately $181,368 with rounding)."
      },
      {
        id: 2,
        question: "Which discount rate should be used when remeasuring a lease liability due to a change in the lease term?",
        options: [
          "The original discount rate at commencement",
          "The current market rate at remeasurement date",
          "A revised discount rate at the remeasurement date",
          "The risk-free rate"
        ],
        correctAnswer: 2,
        explanation: "When the lease term changes, the lease liability is remeasured using a revised discount rate determined at the remeasurement date, reflecting current conditions."
      },
      {
        id: 3,
        question: "In Year 2 of a lease, the opening lease liability is $300,000, the annual payment is $80,000, and the discount rate is 6%. What is the interest expense for Year 2?",
        options: [
          "$4,800",
          "$18,000",
          "$13,200",
          "$80,000"
        ],
        correctAnswer: 1,
        explanation: "Interest expense = Opening liability × Discount rate = $300,000 × 6% = $18,000."
      },
      {
        id: 4,
        question: "A CPI-linked lease payment increases from $100,000 to $103,000 in Year 3. How is this remeasured?",
        options: [
          "Using the original discount rate",
          "Using a revised discount rate",
          "No remeasurement required",
          "Recognize $3,000 immediately in P&L"
        ],
        correctAnswer: 0,
        explanation: "Changes in lease payments due to index adjustments (like CPI) are remeasured using the original discount rate. The lease term hasn't changed, only the payment amount."
      },
      {
        id: 5,
        question: "Initial lease liability is $500,000, initial direct costs are $25,000, and lease incentives received are $40,000. What is the initial ROU asset?",
        options: [
          "$500,000",
          "$485,000",
          "$525,000",
          "$565,000"
        ],
        correctAnswer: 1,
        explanation: "ROU asset = Lease liability + IDC - Incentives = $500,000 + $25,000 - $40,000 = $485,000."
      }
    ]
  },

  // Module 4: Journal Entries & Reporting
  {
    moduleId: 4,
    topics: [
      {
        title: "Lessee Accounting Entries",
        content: "Lessees record three main types of journal entries: initial recognition at commencement, subsequent measurement for interest and depreciation, and lease payments. These entries reflect the finance lease treatment required for most leases under IFRS 16.",
        keyPoints: [
          "Commencement: Dr ROU Asset, Cr Lease Liability",
          "Add: Dr ROU Asset, Cr Cash (for IDC)",
          "Reduce: Dr Lease Liability, Cr ROU Asset (for incentives)",
          "Interest: Dr Interest Expense, Cr Lease Liability",
          "Depreciation: Dr Depreciation Expense, Cr Accumulated Depreciation",
          "Payment: Dr Lease Liability, Cr Cash",
          "No separate rent expense account under IFRS 16",
          "Different from IAS 17 operating lease treatment"
        ],
        example: "Example: Commencement: Dr ROU Asset $450,000, Cr Lease Liability $450,000. Year 1: Dr Interest Expense $22,500, Cr Lease Liability $22,500. Dr Depreciation $90,000, Cr Accumulated Depreciation $90,000. Dr Lease Liability $100,000, Cr Cash $100,000."
      },
      {
        title: "ROU Depreciation",
        content: "The right-of-use asset is depreciated from the commencement date over the shorter of the lease term or the useful life of the underlying asset. Straight-line depreciation is typical, but other methods may be used if they better reflect the pattern of benefit.",
        keyPoints: [
          "Depreciation period: Shorter of lease term or useful life",
          "If ownership transfers or purchase certain: Use useful life",
          "Straight-line method most common",
          "Alternative methods: Units of production if appropriate",
          "Residual value typically zero (lessee doesn't own asset)",
          "Starts at commencement date, not delivery date",
          "Check for impairment under IAS 36",
          "Different from lease liability reduction pattern"
        ],
        example: "Example: ROU asset $600,000, lease term 5 years, no ownership transfer. Annual depreciation = $600,000 / 5 = $120,000. If purchase option exists and exercise is certain, and useful life is 8 years, depreciation = $600,000 / 8 = $75,000."
      },
      {
        title: "P&L Impacts",
        content: "IFRS 16 changes the income statement presentation compared to operating leases. Instead of straight-line rent expense, lessees recognize front-loaded expense patterns with separate interest expense and depreciation expense.",
        keyPoints: [
          "Interest expense: Decreases over time (on declining liability)",
          "Depreciation: Constant if straight-line method used",
          "Total expense: Front-loaded (higher in early years)",
          "EBITDA improvement: Depreciation/interest vs. rent below EBITDA",
          "Interest classified as finance cost",
          "Depreciation classified as operating expense",
          "Variable lease payments (not in liability): Recognized as incurred",
          "Short-term and low-value leases: Straight-line expense"
        ],
        example: "Example: $100,000 annual payment, 5-year lease, 5% rate. Year 1: Interest $21,647 + Depreciation $88,590 = $110,237 (vs. $100,000 cash). Year 5: Interest $4,534 + Depreciation $88,590 = $93,124. Total over 5 years equals $500,000 cash."
      },
      {
        title: "Disclosure Requirements",
        content: "IFRS 16 requires comprehensive disclosures to provide users with information about the nature of leasing activities, future cash commitments, and management judgments. Disclosures are both quantitative and qualitative.",
        keyPoints: [
          "Carrying amount of ROU assets by class of underlying asset",
          "Additions to ROU assets during the period",
          "Depreciation charge for ROU assets by class",
          "Interest expense on lease liabilities",
          "Expense for short-term, low-value, and variable leases",
          "Total cash outflow for leases",
          "Maturity analysis showing undiscounted cash flows",
          "Qualitative: Significant judgments and practical expedients used",
          "Restrictions or covenants imposed by leases"
        ],
        example: "Disclosure example: 'Lease liabilities mature as follows (undiscounted): Year 1: $105,000, Year 2: $105,000, Year 3: $105,000, Year 4: $105,000, Total: $420,000. Present value: $382,947. Weighted average IBR: 4.5%.'"
      }
    ],
    quiz: [
      {
        id: 1,
        question: "At the commencement date, which journal entry correctly records the initial recognition of a lease?",
        options: [
          "Dr Lease Expense, Cr Cash",
          "Dr ROU Asset, Cr Lease Liability",
          "Dr Lease Liability, Cr ROU Asset",
          "Dr Cash, Cr Deferred Rent"
        ],
        correctAnswer: 1,
        explanation: "At commencement, the lessee recognizes a right-of-use asset (debit) and a lease liability (credit) at the present value of lease payments."
      },
      {
        id: 2,
        question: "A right-of-use asset has a cost of $500,000, lease term of 6 years, and the lessee is reasonably certain to exercise a purchase option. The underlying asset has a useful life of 10 years. What is the annual depreciation?",
        options: [
          "$83,333",
          "$50,000",
          "$100,000",
          "$62,500"
        ],
        correctAnswer: 1,
        explanation: "When a purchase option is reasonably certain to be exercised, depreciate over the useful life of the underlying asset: $500,000 / 10 years = $50,000 per year."
      },
      {
        id: 3,
        question: "Compared to an operating lease under previous standards, IFRS 16 lease accounting typically results in:",
        options: [
          "Lower total expenses over the lease term",
          "Higher expenses in early years, lower in later years",
          "Straight-line expense pattern",
          "Higher total expenses over the lease term"
        ],
        correctAnswer: 1,
        explanation: "Under IFRS 16, the combination of high interest expense (early years) and constant depreciation creates front-loaded expenses. Total expense over the lease term equals total cash payments, but timing differs."
      },
      {
        id: 4,
        question: "Which of the following must be disclosed in the notes to the financial statements?",
        options: [
          "Only the total lease liability",
          "Only depreciation on ROU assets",
          "A maturity analysis of lease liabilities showing undiscounted cash flows",
          "Only the total ROU assets"
        ],
        correctAnswer: 2,
        explanation: "IFRS 16 requires a maturity analysis showing undiscounted future lease payments by year, along with many other quantitative and qualitative disclosures."
      },
      {
        id: 5,
        question: "Variable lease payments that do not depend on an index or rate are:",
        options: [
          "Included in the lease liability",
          "Capitalized to the ROU asset",
          "Recognized as expense when incurred",
          "Disclosed only, not recognized"
        ],
        correctAnswer: 2,
        explanation: "Variable lease payments that depend on usage or performance (not an index/rate) are excluded from the lease liability and recognized as expense in the period when the triggering event occurs."
      }
    ]
  },

  // Module 5: Advanced Modelling & Automation
  {
    moduleId: 5,
    topics: [
      {
        title: "Portfolio Modelling",
        content: "Managing multiple leases requires a systematic approach to data collection, calculation, and reporting. Portfolio modelling involves creating scalable processes and tools to handle hundreds or thousands of leases efficiently while maintaining accuracy and compliance.",
        keyPoints: [
          "Centralized lease repository with all contracts and key data",
          "Standardized data templates for consistent inputs",
          "Automated calculation engines for ROU and liability",
          "Classification logic: Short-term vs. long-term liability splits",
          "Aggregation by lease type, geography, or business unit",
          "Roll-forward reconciliations for opening to closing balances",
          "Variance analysis for period-over-period changes",
          "Integration with general ledger systems",
          "Support for multiple currencies and entities"
        ],
        example: "Example: Company has 500 leases. Portfolio tool imports all lease data, calculates individual ROU/liability amounts, aggregates by class (vehicles, property, equipment), generates journal entries, and produces maturity analysis table for disclosure—all automated."
      },
      {
        title: "Scenario Analysis",
        content: "Scenario analysis helps organizations understand the financial impact of different lease decisions, such as lease vs. buy, lease term options, and early termination. Sensitivity analysis on key assumptions (discount rate, lease term) is also critical.",
        keyPoints: [
          "Lease vs. buy analysis: Compare NPV of leasing vs. purchasing",
          "Lease term sensitivity: Model different term assumptions",
          "Discount rate sensitivity: Test IBR assumptions (±100 bps)",
          "Extension option analysis: Financial impact of exercising options",
          "Modification scenarios: Impact of rent reductions or amendments",
          "Portfolio optimization: Identify opportunities to restructure",
          "Budget forecasting: Project future lease additions and expirations",
          "Covenant testing: Ensure compliance with debt covenants"
        ],
        example: "Scenario: Lease $1M asset for 5 years at $220k/year vs. buy for $1M with 8% loan. Lease NPV at 8% = $878k. Purchase NPV (including depreciation tax shield) = $850k. Buying is economically better by $28k NPV."
      },
      {
        title: "Lease Modifications",
        content: "Modifications occur when lease terms are changed (scope, price, or term). IFRS 16 requires assessing whether the modification is a separate lease or modification of the existing lease, with different accounting treatments for each.",
        keyPoints: [
          "Separate lease if: Increases scope AND price reflects stand-alone price",
          "Example of separate lease: Adding another floor to office lease at market rate",
          "Modification of existing lease: All other changes",
          "Accounting for modification: Remeasure liability using revised rate",
          "Adjust ROU asset for difference between liability change and any prepayments",
          "Scope reduction: Decrease ROU and liability, recognize gain/loss",
          "Common modifications: Rent concessions, term extensions, space changes",
          "COVID-19 rent concessions: Practical expedient available"
        ],
        example: "Example: Modify lease to reduce space by 30%. Reduce liability by 30% and reduce ROU by 30%. If ROU reduction ($180k) > liability reduction ($160k), recognize $20k gain. If opposite, increase ROU by difference."
      },
      {
        title: "Automation Opportunities",
        content: "Automation reduces manual effort, minimizes errors, and ensures consistency in lease accounting. Key areas for automation include data extraction, calculations, journal entry generation, and disclosure preparation.",
        keyPoints: [
          "OCR and AI for contract data extraction",
          "Automated lease classification (lease vs. service)",
          "Calculation engines for ROU, liability, and amortization schedules",
          "Trigger-based remeasurement workflows",
          "Automated journal entry generation and posting",
          "Real-time dashboards for portfolio monitoring",
          "Scheduled disclosure report generation",
          "Audit trail and version control",
          "Integration with contract management systems"
        ],
        example: "Automation example: System scans new lease contracts, extracts key terms (term, payments, commencement), classifies as lease/service, calculates ROU/liability, generates journal entries, posts to GL, and updates disclosure reports—all without manual intervention."
      },
      {
        title: "System Integration",
        content: "Effective lease accounting requires integration between lease management systems, accounting systems (ERP/GL), and source systems (procurement, real estate). Integration ensures data flows seamlessly and reduces duplicate entry.",
        keyPoints: [
          "Source systems: Contract management, procurement, facilities",
          "Lease accounting system: Purpose-built or module within ERP",
          "Target system: General ledger for financial reporting",
          "API integrations for real-time data exchange",
          "Batch interfaces for periodic updates",
          "Master data synchronization (entities, cost centers, accounts)",
          "Workflow automation for approvals and reviews",
          "Data validation and exception handling",
          "Audit and compliance reporting"
        ],
        example: "Integration flow: (1) New lease contract in contract management system → (2) Auto-creates lease in lease accounting system → (3) Calculates ROU/liability → (4) Generates journal entries → (5) Posts to GL via API → (6) Updates dashboards and disclosure reports."
      },
      {
        title: "Controls",
        content: "Strong internal controls over lease accounting ensure accurate financial reporting and SOX compliance. Controls span the entire lease lifecycle from contract inception through calculation, approval, and disclosure.",
        keyPoints: [
          "Contract completeness: Ensure all leases identified and recorded",
          "Classification accuracy: Lease vs. service determination reviewed",
          "Data accuracy: Key inputs (term, rate, payments) validated",
          "Calculation accuracy: Review calculations and reasonableness",
          "Approval workflows: Proper authorization for entries and assumptions",
          "Reconciliations: ROU/liability to sub-ledger and GL",
          "Disclosure reviews: Accuracy and completeness of note disclosures",
          "Access controls: Segregation of duties in systems",
          "Change management: Documented process for modifications",
          "Evidence retention: Supporting documentation archived"
        ],
        example: "Control example: Monthly reconciliation control—Preparer reconciles lease sub-ledger ROU/liability totals to GL balances. Reviewer independently verifies tie-out, investigates variances >$10k, approves reconciliation. Evidence: Reconciliation workpaper with reviewer sign-off."
      }
    ],
    quiz: [
      {
        id: 1,
        question: "When managing a lease portfolio, which approach is MOST effective for ensuring consistency across hundreds of leases?",
        options: [
          "Manual spreadsheet calculations for each lease",
          "Different accounting methods for different lease types",
          "Standardized data templates and automated calculation engines",
          "Hiring more accountants to handle the workload"
        ],
        correctAnswer: 2,
        explanation: "Standardized data templates and automated calculation engines ensure consistency, reduce errors, and enable efficient management of large lease portfolios."
      },
      {
        id: 2,
        question: "A lease modification increases the scope by adding additional equipment at a price that reflects the stand-alone price for that equipment. How should this be accounted for?",
        options: [
          "Remeasure the existing lease liability",
          "Account for it as a separate lease",
          "Recognize the change immediately in profit or loss",
          "Ignore until the next annual review"
        ],
        correctAnswer: 1,
        explanation: "When a modification increases scope AND the price reflects the stand-alone price of the additional right-of-use, it is accounted for as a separate lease, not a modification."
      },
      {
        id: 3,
        question: "Which of the following represents the BEST automation opportunity in lease accounting?",
        options: [
          "Manually reviewing each contract quarterly",
          "Using OCR and AI to extract lease data from contracts automatically",
          "Hiring external consultants to calculate lease liabilities",
          "Maintaining separate spreadsheets for each lease"
        ],
        correctAnswer: 1,
        explanation: "OCR (Optical Character Recognition) and AI can automatically extract lease terms from contracts, significantly reducing manual effort and improving accuracy."
      },
      {
        id: 4,
        question: "A company modifies a lease to reduce the scope by 40% (reducing leased space). The liability reduction is $200,000 and the ROU asset reduction is $220,000. What is the impact?",
        options: [
          "Recognize a $20,000 gain",
          "Recognize a $20,000 loss",
          "Increase ROU asset by $20,000",
          "No gain or loss, adjust ROU asset only"
        ],
        correctAnswer: 1,
        explanation: "When scope is reduced, if the ROU asset reduction ($220k) exceeds the liability reduction ($200k), recognize a loss of $20,000 in profit or loss."
      },
      {
        id: 5,
        question: "Which control is MOST important for ensuring completeness of lease accounting?",
        options: [
          "Reviewing depreciation calculations",
          "Reconciling the general ledger monthly",
          "Ensuring all lease contracts are identified and recorded",
          "Checking discount rate assumptions"
        ],
        correctAnswer: 2,
        explanation: "Completeness is the most fundamental control objective—ensuring all leases are identified and recorded in the system. Without this, other controls are ineffective as leases may be entirely missing."
      }
    ]
  }
];
