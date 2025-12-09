
import React, { useState } from 'react';
import {
  Shield, FileText, Download, BookOpen, Calculator, TrendingUp,
  Calendar, DollarSign, BarChart3, CheckCircle2, XCircle,
  ArrowRight, Info, Lightbulb, AlertCircle, Target, Percent
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export const Methodology: React.FC = () => {   // 👈 named export instead of const + default
  const [activeSection, setActiveSection] = useState('introduction');
  const [activeAssumption, setActiveAssumption] = useState('identification');
  const [activeOther, setActiveOther] = useState('lease-term');

  // centralised content
  const content = {
    introduction: {
      title: 'Scope of the Application',
      paragraphs: [
        "The document presents the Bank’s approach to the application of IFRS 16 Leases: regulations on:",
      ],
      bullets: [
        'Identification and measurement of lease arrangements and their treatment in the financial statements of the Bank.',
        'Recognition of interest expense and depreciation on lease liabilities measured at amortized cost and right of use (ROU) assets.'
      ],
      covered: [
        'Off-Balance sheet leases',
        'Land and buildings',
        'Aircraft',
        'Landed properties for executive or management staff or expatriates',
        'Machinery / equipment',
        'Other temporary or not wholly-owned assets within the Bank’s control for which it possesses the right of use and has the ability to obtain all economic benefits'
      ],
      excluded: [
        'Off-balance sheet leases',
        'Short-term leases',
        'Low-value assets'
      ],
      closing: [
        'This model (“Model”) has been developed to provide high-level indicative results of the Bank\'s leased assets. The Model has been prepared to report information that faithfully represents lease transactions and provides the Bank with a basis for users of financial statements to assess the amount, timing and uncertainty of cash flows arising from leased asset based on the provisions of IFRS 16.',
        'To meet this objective, the Bank is expected to recognize assets and liabilities arising from a lease from the commencement date of the contract.',
        'In order to facilitate understanding of this methodological framework, the key terms and their relevant meaning are summarized in Appendix 1 – Glossary of Terms.'
      ]
    },

    assumptions: {
      title: 'General IFRS 16 Assumptions',
      paragraphs: [
        'In this chapter general IFRS assumptions regarding the measurement of the Right of use assets are described. A detailed description of the practical implementation of the model methodology in the Bank is presented in subsequent chapters.',
      ],

      subsections: {
        identification: {
          title: 'Identification of Right of Use Asset',
          heading: 'Recognition of Right of Use Assets',
          paragraphs: [
            "The approach in IFRS 16 is based on control and economic benefit. Therefore, the Bank recognizes a 'right-of-use' asset for all leases (subject to specified exemptions), which represents its right to use the underlying leased asset for the period of the lease.",
            "The only exception is for short-term and low-value leases or for contracts for which the Bank cannot validate the extent to which it controls the assets or where substantial economic benefits do not flow to the Bank."
          ]
        },

        measurement: {
          title: 'Measurement of Lease Liability',
          heading: 'Approach to the Measurement of Lease Liability',
          paragraphs: [
            'The general approach and a requirement by the standard on the measurement of lease liabilities are to initially determine the present value of lease payments discounted using the discount rate implicit in the lease (or if that rate cannot be readily determined the lessee\'s incremental borrowing rate).',
            'The approach adopted by the Bank is the use of incremental borrowing costs. The date of initial recognition or contract start date is important in measuring the lease liability as it is the date by which the Bank receives the contractual right to control the use of the asset.'
          ]
        },

        other: {
          title: 'Other Assumptions',
          subsections: {
            'lease-term': {
              title: 'Lease Term',
              paragraphs: [
                'In principle, a lessee is required to reassess whether it is reasonably certain to exercise an extension option, or not to exercise a termination option, upon the occurrence of either a significant event or a significant change in circumstances that:',
              ],
              bullets: [
                'It is within the control of the lessee',
                'Affects whether the lessee is reasonably certain to exercise an option not previously included in its determination of the lease term, or not to exercise an option previously included in its determination of the lease term.'
              ],
              additional: [
                'The lease term is assumed to extend after centering judgement on reasonable and observable assumptions. IFRS 16 provides that the lessee, in determining the lease term, must also consider the periods covered by an option (enforceable right) to extend the leases if the lessee is reasonably certain to exercise that option.'
              ],
              considerations: [
                {
                  title: 'Enforceable right to extend',
                  text: 'Lease extension was only considered for contracts that have the extension term stated in the contract to avoid assumptions without documentary evidence especially when extension term is still subject to management decision.'
                },
                {
                  title: 'Historical trend of extension',
                  text: 'For contracts with validated extension enforceable rights, the Bank’s consistency in extending these contracts was used as a further basis of assumption in determining the reasonable certainty of extending the current lease contracts where extension tenor is quantifiable.'
                }
              ]
            },

            'future-payments': {
              title: 'Future Lease Payments',
              paragraphs: [
                'In principle, when assessing the lessee’s extension options, the amount of payment for the lease arrangement in any optional period must also be assessed. The Bank has made a prudent assumption that the lease payments for the optional period will rise by a certain percentage based on its location and as such will result in a rise in payments.'
              ],
              additional: [
                'In the absence of discrete property growth rates, no growth rate has been adopted. Subsequently, historical rates can be adopted as a basis of growth rate in lease payments.',
                'Where the growth rate is explicitly stated in the contract, this growth rate may be adopted for the purpose of calculating the growth rate in future lease payments.'
              ]
            },

            'discount-rate': {
              title: 'Discount Rate (IBR)',
              paragraphs: [
                'IFRS 16:26 stipulates that lease payments should be discounted using the interest rate implicit in the lease; or if the interest rate implicit in the lease cannot be readily determined, the lessee\'s incremental borrowing rate.',
                'The interest rate implicit in the lease (IRIL) is ideally to be made available in lease contracts. However, this was undeterminable at transition.',
                'The Bank’s IBR has been adopted as the lease liability discounting rate.'
              ],
              bullets: [
                'Similar term',
                'Similar security',
                'Similar economic environment'
              ],
              note: 'IBR is the rate of interest that the Bank would have to pay to borrow over a similar term, and with a similar security, the funds necessary to obtain an asset of a similar value to the right-of-use asset in a similar economic environment.'
            },

            'structure': {
              title: 'Structure in Lease Payments',
              paragraphs: [
                'It is an assumption that the Bank will always pay in advance for all its lease arrangements at the inception of the contract. These payments are also assumed to be consistent over the months for which they have been prepaid. In such cases, the Bank uses its experienced judgement to estimate the amount of any impairment loss.'
              ]
            }
          }
        },

        modelLogics: {
          title: 'Model Calculation Logics',
          subsections: {
            rou: {
              title: 'Right of Use Asset',
              bullets: [
                'Present value of future lease liability',
                'Lease payments made at or before the commencement date',
                'ROU @ origination',
                'Depreciation for the period',
                'ROU @ REP DATE',
              ]
            },
            liability: {
              title: 'Lease Liability',
              paragraphs: [
                'Given that the Bank will always make payment in advance, lease liability is calculated for contract bases on extension option as:',
                'liability = pv(extension amount) = extension amount * 1 / (1+r)^(-t)',
                'Where r is the discount rate and t is the time from the start of the contract to the end.',
              ]
            },
            depreciation: {
              title: 'Depreciation',
              paragraphs: [
                'An asset is depreciated from the commencement date to the end of the lease contract. The asset is depreciated from the commencement date to the later of:',
              ],
              bullets: [
                'the end of extension; or',
                'the end of the lease term.'
              ]
            },
            interest: {
              title: 'Interest Expense',
              paragraphs: [
                'The finance charge is treated as a finance cost in profit or loss for the period. The partial repayment of the lease obligation reduces the amount of the liability that remains unpaid.',
                'It is calculated as:',
                'Lease interest expense = lease liability_(t) - lease liability_(t-1)'
              ]
            }
          }
        }
      }
    }
  };

  const assumptionSubsections = [
    { id: 'identification', title: 'Identification of ROU Asset' },
    { id: 'measurement', title: 'Measurement of Lease Liability' },
    { id: 'other', title: 'Other Assumptions' },
    { id: 'model-logics', title: 'Model Calculation Logics' },
  ];

  const otherSubsections = [
    { id: 'lease-term', title: 'Lease Term' },
    { id: 'future-payments', title: 'Future Lease Payments' },
    { id: 'discount-rate', title: 'Discount Rate (IBR)' },
    { id: 'structure', title: 'Structure in Lease Payments' },
  ];

  // PDF export
  const handleDownload = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 15, pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const writeTitle = (text: string) => {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14);
      const lines = pdf.splitTextToSize(text, maxWidth); pdf.text(lines, margin, y);
      y += lines.length * 7 + 4; if (y > pageHeight - 20) { pdf.addPage(); y = 20; }
    };
    const writeParagraph = (text: string) => {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(text, maxWidth); pdf.text(lines, margin, y);
      y += lines.length * 6 + 4; if (y > pageHeight - 20) { pdf.addPage(); y = 20; }
    };
    const writeBulletList = (items: string[]) => items.forEach(it => writeParagraph('• ' + it));

    // Cover
    writeTitle('IFRS 16 Leases Methodology');
    writeParagraph('Bank’s framework for application of IFRS 16');

    // Introduction
    writeTitle(content.introduction.title);
    content.introduction.paragraphs.forEach(writeParagraph);
    writeBulletList(content.introduction.bullets);
    writeParagraph('Leased Assets Covered by the Model:'); writeBulletList(content.introduction.covered);
    writeParagraph('Items Not Covered by the Model:'); writeBulletList(content.introduction.excluded);
    content.introduction.closing.forEach(writeParagraph);

    // Assumptions
    writeTitle(content.assumptions.title);
    content.assumptions.paragraphs.forEach(writeParagraph);

    const subs = content.assumptions.subsections;

    // Identification
    writeTitle(subs.identification.title);
    writeParagraph(subs.identification.heading);
    subs.identification.paragraphs.forEach(writeParagraph);

    // Measurement
    writeTitle(subs.measurement.title);
    writeParagraph(subs.measurement.heading);
    subs.measurement.paragraphs.forEach(writeParagraph);

    // Other Assumptions
    writeTitle(subs.other.title);
    const others = subs.other.subsections;

    writeTitle(others['lease-term'].title);
    others['lease-term'].paragraphs.forEach(writeParagraph);
    writeBulletList(others['lease-term'].bullets);
    others['lease-term'].additional.forEach(writeParagraph);
    others['lease-term'].considerations.forEach(c => {
      writeParagraph(c.title + ':');
      writeParagraph(c.text);
    });

    writeTitle(others['future-payments'].title);
    others['future-payments'].paragraphs.forEach(writeParagraph);
    others['future-payments'].additional.forEach(writeParagraph);

    writeTitle(others['discount-rate'].title);
    others['discount-rate'].paragraphs.forEach(writeParagraph);
    writeBulletList(others['discount-rate'].bullets);
    writeParagraph(others['discount-rate'].note);

    writeTitle(others['structure'].title);
    others['structure'].paragraphs.forEach(writeParagraph);

    // Model Calculation Logics
    writeTitle(subs.modelLogics.title);

    // Right of Use Asset
    writeTitle(subs.modelLogics.subsections.rou.title);
    writeBulletList(subs.modelLogics.subsections.rou.bullets);

    // Lease Liability
    writeTitle(subs.modelLogics.subsections.liability.title);
    subs.modelLogics.subsections.liability.paragraphs.forEach(writeParagraph);

    // Depreciation
    writeTitle(subs.modelLogics.subsections.depreciation.title);
    subs.modelLogics.subsections.depreciation.paragraphs.forEach(writeParagraph);
    writeBulletList(subs.modelLogics.subsections.depreciation.bullets);

    // Interest Expense
    writeTitle(subs.modelLogics.subsections.interest.title);
    subs.modelLogics.subsections.interest.paragraphs.forEach(writeParagraph);

    // Save file
    pdf.save('IFRS16_Methodology.pdf');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Professional Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 text-white shadow-xl">
        <div className="w-full px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/30 dark:border-white/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">IFRS 16 Leases Methodology</h1>
                <p className="text-white/90 dark:text-slate-300 mt-1">Comprehensive Framework for Lease Accounting Standards</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-white text-blue-700 dark:text-slate-800 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 dark:hover:bg-slate-100 transition-all duration-200 font-medium"
            >
              <Download className="h-5 w-5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-8">
        <div className="flex gap-6 min-h-screen">
          {/* Sidebar Navigation */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 sticky top-6 overflow-hidden h-[calc(100vh-8rem)]">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600/30 dark:to-indigo-600/30 p-4 border-b border-slate-300 dark:border-white/10">
                <h3 className="font-semibold text-white flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-white dark:text-blue-300" />
                  Table of Contents
                </h3>
              </div>
              <nav className="p-2 overflow-y-auto h-[calc(100%-4rem)]">
                {[
                  { id: 'introduction', title: 'Introduction & Scope', icon: Shield, color: 'blue' },
                  { id: 'identification', title: 'Identification of ROU', icon: Target, color: 'purple' },
                  { id: 'measurement', title: 'Measurement of Liability', icon: Calculator, color: 'emerald' },
                  { id: 'lease-term', title: 'Lease Term', icon: Calendar, color: 'amber' },
                  { id: 'future-payments', title: 'Future Lease Payments', icon: DollarSign, color: 'rose' },
                  { id: 'discount-rate', title: 'Discount Rate (IBR)', icon: Percent, color: 'cyan' },
                  { id: 'structure', title: 'Payment Structure', icon: BarChart3, color: 'violet' },
                  { id: 'model-logics', title: 'Calculation Logics', icon: Calculator, color: 'indigo' },
                ].map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left mb-1 ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-white shadow-lg border border-blue-300 dark:border-blue-400/30'
                          : 'text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-200 dark:bg-blue-400/30' : 'bg-slate-200 dark:bg-white/5'}`}>
                        <Icon className={`h-4 w-4 ${isActive ? 'text-blue-700 dark:text-white' : 'text-slate-600 dark:text-white/60'}`} />
                      </div>
                      <span className="text-sm font-medium flex-1">{section.title}</span>
                      {isActive && <ArrowRight className="h-4 w-4" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {activeSection === 'introduction' && (
              <div className="space-y-6">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-slate-700 dark:to-slate-800 rounded-2xl shadow-xl p-8 text-white border border-blue-300 dark:border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <Shield className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">{content.introduction.title}</h2>
                      </div>
                      <p className="text-white/95 dark:text-slate-300 text-lg leading-relaxed mb-4">{content.introduction.paragraphs[0]}</p>
                      <ul className="space-y-2">
                        {content.introduction.bullets.map((b, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-white/90 dark:text-slate-200">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Assets Coverage Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                      <div className="flex items-center space-x-2 text-white">
                        <CheckCircle2 className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Assets Covered by the Model</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <ul className="space-y-3">
                        {content.introduction.covered.map((c, i) => (
                          <li key={i} className="flex items-start group">
                            <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 mr-3 mt-0.5 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30 transition-colors">
                              <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                            </div>
                            <span className="text-slate-800 dark:text-white/90">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-4">
                      <div className="flex items-center space-x-2 text-white">
                        <XCircle className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Items Not Covered</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <ul className="space-y-3">
                        {content.introduction.excluded.map((e, i) => (
                          <li key={i} className="flex items-start group">
                            <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 mr-3 mt-0.5 group-hover:bg-rose-200 dark:group-hover:bg-rose-500/30 transition-colors">
                              <XCircle className="h-4 w-4 text-rose-700 dark:text-rose-300" />
                            </div>
                            <span className="text-slate-800 dark:text-white/90">{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Additional Information Cards */}
                {content.introduction.closing.map((p, i) => (
                  <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg mt-1">
                        <Info className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                      </div>
                      <p className="text-slate-800 dark:text-white/90 leading-relaxed flex-1">{p}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'identification' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white border border-purple-300 dark:border-white/10">
                  <div className="flex items-center space-x-3 mb-4">
                    <Target className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">{content.assumptions.subsections.identification.title}</h2>
                  </div>
                  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-white/20">
                    <h3 className="font-semibold text-lg mb-3">{content.assumptions.subsections.identification.heading}</h3>
                    <div className="space-y-3">
                      {content.assumptions.subsections.identification.paragraphs.map((p, i) => (
                        <p key={i} className="text-white/95 dark:text-purple-50 leading-relaxed">{p}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Principle</h4>
                      <p className="text-slate-700 dark:text-white/90">The approach in IFRS 16 is based on control and economic benefit, requiring recognition of right-of-use assets for all qualifying leases.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'measurement' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white border border-emerald-300 dark:border-white/10">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calculator className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">{content.assumptions.subsections.measurement.title}</h2>
                  </div>
                  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-white/20">
                    <h3 className="font-semibold text-lg mb-3">{content.assumptions.subsections.measurement.heading}</h3>
                    <div className="space-y-3">
                      {content.assumptions.subsections.measurement.paragraphs.map((p, i) => (
                        <p key={i} className="text-white/95 dark:text-emerald-50 leading-relaxed">{p}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-5">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Discount Rate</h4>
                    </div>
                    <p className="text-slate-700 dark:text-white/80 text-sm">Present value calculated using the implicit rate in the lease or incremental borrowing rate</p>
                  </div>
                  <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-5">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Recognition Date</h4>
                    </div>
                    <p className="text-slate-700 dark:text-white/80 text-sm">Initial recognition occurs at commencement date when control of the asset begins</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'lease-term' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white border border-amber-300 dark:border-white/10">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">Lease Term</h2>
                  </div>
                  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-white/20">
                    <div className="space-y-3">
                      {content.assumptions.subsections.other.subsections['lease-term'].paragraphs.map((p, i) => (
                        <p key={i} className="text-white/95 dark:text-amber-50 leading-relaxed">{p}</p>
                      ))}
                      <ul className="space-y-2 mt-4">
                        {content.assumptions.subsections.other.subsections['lease-term'].bullets.map((b, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-white/95 dark:text-amber-50">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {content.assumptions.subsections.other.subsections['lease-term'].additional.map((p, i) => (
                  <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                        <Info className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                      </div>
                      <p className="text-slate-800 dark:text-white/90 leading-relaxed flex-1">{p}</p>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.assumptions.subsections.other.subsections['lease-term'].considerations.map((c, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-amber-300 dark:border-amber-500/20">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                          <Target className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{c.title}</h4>
                      </div>
                      <p className="text-slate-700 dark:text-white/80 text-sm leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'future-payments' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">Future Lease Payments</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 space-y-3">
                    {content.assumptions.subsections.other.subsections['future-payments'].paragraphs.map((p, i) => (
                      <p key={i} className="text-rose-50 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>

                {content.assumptions.subsections.other.subsections['future-payments'].additional.map((p, i) => (
                  <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-300" />
                      </div>
                      <p className="text-slate-800 dark:text-white/90 leading-relaxed flex-1">{p}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'discount-rate' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <Percent className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">Discount Rate (IBR)</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 space-y-3">
                    {content.assumptions.subsections.other.subsections['discount-rate'].paragraphs.map((p, i) => (
                      <p key={i} className="text-cyan-50 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 dark:from-cyan-500/30 dark:to-blue-500/30 p-5 border-b border-slate-300 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-cyan-600 dark:text-cyan-300" />
                      IBR Calculation Factors
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {content.assumptions.subsections.other.subsections['discount-rate'].bullets.map((b, i) => (
                        <div key={i} className="flex items-center space-x-3 p-4 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-cyan-600 dark:text-cyan-300 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-white/90 font-medium">{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-500/20 rounded-xl border-l-4 border-blue-500 dark:border-blue-400">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-800 dark:text-white/90 text-sm leading-relaxed">{content.assumptions.subsections.other.subsections['discount-rate'].note}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'structure' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <BarChart3 className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">Structure in Lease Payments</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 space-y-3">
                    {content.assumptions.subsections.other.subsections['structure'].paragraphs.map((p, i) => (
                      <p key={i} className="text-violet-50 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Assumption</h4>
                      <p className="text-slate-800 dark:text-white/90">All lease payments are assumed to be made in advance at inception, with consistent monthly allocations for prepaid periods.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'model-logics' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calculator className="h-7 w-7" />
                    <h2 className="text-2xl font-bold">Model Calculation Logics</h2>
                  </div>
                  <p className="text-indigo-100">Comprehensive overview of calculation methodologies for lease accounting</p>
                </div>

                {/* Right of Use Asset */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5">
                    <h3 className="font-bold text-white text-lg flex items-center">
                      <Target className="h-6 w-6 mr-2" />
                      {content.assumptions.subsections.modelLogics.subsections.rou.title}
                    </h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {content.assumptions.subsections.modelLogics.subsections.rou.bullets.map((b, i) => (
                        <li key={i} className="flex items-start">
                          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 mr-3 mt-0.5">
                            <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <span className="text-slate-800 dark:text-white/90">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Lease Liability */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5">
                    <h3 className="font-bold text-white text-lg flex items-center">
                      <DollarSign className="h-6 w-6 mr-2" />
                      {content.assumptions.subsections.modelLogics.subsections.liability.title}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {content.assumptions.subsections.modelLogics.subsections.liability.paragraphs.map((p, i) => (
                      <p key={i} className="text-slate-800 dark:text-white/90 leading-relaxed">{p}</p>
                    ))}
                    <div className="bg-blue-100 dark:bg-blue-500/20 rounded-xl p-4 border-l-4 border-blue-500 dark:border-blue-400">
                      <code className="text-blue-700 dark:text-blue-200 text-sm font-mono">
                        liability = pv(extension amount) = extension amount × 1 / (1+r)^(-t)
                      </code>
                    </div>
                  </div>
                </div>

                {/* Depreciation */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
                    <h3 className="font-bold text-white text-lg flex items-center">
                      <TrendingUp className="h-6 w-6 mr-2" />
                      {content.assumptions.subsections.modelLogics.subsections.depreciation.title}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {content.assumptions.subsections.modelLogics.subsections.depreciation.paragraphs.map((p, i) => (
                      <p key={i} className="text-slate-800 dark:text-white/90 leading-relaxed">{p}</p>
                    ))}
                    <ul className="space-y-2">
                      {content.assumptions.subsections.modelLogics.subsections.depreciation.bullets.map((b, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-white/90">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Interest Expense */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-slate-300 dark:border-white/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-5">
                    <h3 className="font-bold text-white text-lg flex items-center">
                      <Percent className="h-6 w-6 mr-2" />
                      {content.assumptions.subsections.modelLogics.subsections.interest.title}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {content.assumptions.subsections.modelLogics.subsections.interest.paragraphs.map((p, i) => (
                      <p key={i} className="text-slate-800 dark:text-white/90 leading-relaxed">{p}</p>
                    ))}
                    <div className="bg-rose-100 dark:bg-rose-500/20 rounded-xl p-4 border-l-4 border-rose-500 dark:border-rose-400">
                      <code className="text-rose-700 dark:text-rose-200 text-sm font-mono">
                        Lease interest expense = lease liability_(t) - lease liability_(t-1)
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

