import React, { useMemo } from 'react';
import { useLeaseContext } from '../context/LeaseContext';
import { calculateIFRS16 } from '../utils/ifrs16Calculator';
import {
  FileText,
  Calculator,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Activity,
  Building,
  Car,
  Wrench
} from 'lucide-react';

export function Dashboard() {
  const { state } = useLeaseContext();
  const { savedContracts } = state;

  // Calculate aggregated totals from all saved contracts
  const aggregatedData = useMemo(() => {
    let totalROU = 0;
    let totalLiability = 0;
    let totalInterest = 0;
    let totalDepreciation = 0;
    let totalLeaseTermYears = 0;
    const validContracts = [];

    for (const contract of savedContracts) {
      const data = contract.data;

      // Check if contract has required data
      const hasRequiredData = !!(
        data.ContractID &&
        data.CommencementDate &&
        data.NonCancellableYears &&
        data.FixedPaymentPerPeriod &&
        data.IBR_Annual
      );

      if (hasRequiredData) {
        try {
          const results = calculateIFRS16(data);
          totalROU += results.initialROU;
          totalLiability += results.initialLiability;
          totalInterest += results.totalInterest;
          totalDepreciation += results.totalDepreciation;
          totalLeaseTermYears += results.leaseTermYears;
          validContracts.push({ contract, results });
        } catch (error) {
          console.error(`Failed to calculate for contract ${data.ContractID}:`, error);
        }
      }
    }

    const avgLeaseTermYears = validContracts.length > 0 ? totalLeaseTermYears / validContracts.length : 0;

    return {
      totalROU,
      totalLiability,
      totalInterest,
      totalDepreciation,
      avgLeaseTermYears,
      validContracts,
      totalContracts: savedContracts.length
    };
  }, [savedContracts]);

  // Mock data for demonstration - in real app this would come from API
  const portfolioData = [
    { category: 'Real Estate', value: 1.9, contracts: 8, percentage: 75.5, color: 'bg-blue-500' },
    { category: 'Vehicles', value: 0.3, contracts: 4, percentage: 13.1, color: 'bg-gray-400' },
    { category: 'Equipment', value: 0.3, contracts: 3, percentage: 11.4, color: 'bg-blue-600' }
  ];

  const monthlyTrends = [
    { period: 'Jan', liability: 2.4, asset: 2.6, depreciation: 42 },
    { period: 'Feb', liability: 2.4, asset: 2.6, depreciation: 41 },
    { period: 'Mar', liability: 2.3, asset: 2.5, depreciation: 40 },
    { period: 'Apr', liability: 2.3, asset: 2.5, depreciation: 40 },
    { period: 'May', liability: 2.2, asset: 2.4, depreciation: 39 },
    { period: 'Jun', liability: 2.2, asset: 2.5, depreciation: 39 }
  ];

  const upcomingMaturities = [
    { contract: 'Office Lease - Downtown', maturityDate: '2024-12-31', liability: 185000, daysToMaturity: 267, status: 'Urgent' },
    { contract: 'Vehicle Fleet - Sales', maturityDate: '2025-03-15', liability: 45000, daysToMaturity: 193, status: 'Urgent' },
    { contract: 'Warehouse - North', maturityDate: '2025-06-30', liability: 320000, daysToMaturity: 86, status: 'Urgent' }
  ];

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 flex items-center gap-3 shadow-xl">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Overview of your IFRS 16 lease portfolio</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total ROU Assets */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total ROU Assets</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-500">
            {aggregatedData.totalROU > 0 ? `₦${(aggregatedData.totalROU / 1000000).toFixed(1)}M` : '₦0.0M'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{aggregatedData.validContracts.length} calculated</p>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Liabilities</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-500">
            {aggregatedData.totalLiability > 0 ? `₦${(aggregatedData.totalLiability / 1000000).toFixed(1)}M` : '₦0.0M'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{aggregatedData.validContracts.length} calculated</p>
        </div>

        {/* Monthly Depreciation */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Depreciation</span>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-500">
            {aggregatedData.totalDepreciation > 0
              ? `₦${((aggregatedData.totalDepreciation / (aggregatedData.avgLeaseTermYears || 1) / 12) / 1000).toFixed(0)}K`
              : '₦0K'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Average across portfolio</p>
        </div>

        {/* Monthly Interest */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Interest</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">
            {aggregatedData.totalInterest > 0
              ? `₦${((aggregatedData.totalInterest / (aggregatedData.avgLeaseTermYears || 1) / 12) / 1000).toFixed(0)}K`
              : '₦0K'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Average across portfolio</p>
        </div>

        {/* Active Contracts */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Contracts</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-500">
            {aggregatedData.totalContracts}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{aggregatedData.validContracts.length} with calculations</p>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Expiring Soon</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {aggregatedData.validContracts.filter(vc => {
              const endDate = new Date(vc.contract.data.EndDateOriginal || '');
              const monthsToExpiry = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
              return monthsToExpiry <= 6 && monthsToExpiry > 0;
            }).length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Next 6 months</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Composition */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Portfolio Composition</h3>
            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>

          <div className="space-y-4">
            {portfolioData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.category === 'Real Estate' && <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    {item.category === 'Vehicles' && <Car className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    {item.category === 'Equipment' && <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">₦{item.value}M</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">({item.contracts} contracts)</div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{item.percentage}% of total portfolio</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends Table */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Monthly Trends</h3>
            <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Period</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Liability</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Asset</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Depreciation</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((trend, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-2 text-sm text-slate-700 dark:text-slate-300">{trend.period}</td>
                    <td className="py-3 px-2 text-sm text-blue-600 dark:text-blue-400 text-right font-medium">₦{trend.liability}M</td>
                    <td className="py-3 px-2 text-sm text-green-600 dark:text-green-400 text-right font-medium">₦{trend.asset}M</td>
                    <td className="py-3 px-2 text-sm text-orange-600 dark:text-orange-400 text-right font-medium">₦{trend.depreciation}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Payment Performance */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Payment Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">On Time</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">98.5%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>47 of 48 payments</span>
              <span>Last 12 months</span>
            </div>
          </div>
        </div>

        {/* Lease Modifications */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Lease Modifications</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">This quarter</div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">-2 from last quarter</span>
            </div>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Compliance Score</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">94%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">IFRS 16 Compliance</div>
          </div>
        </div>

        {/* Cost Savings */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Cost Optimization</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">₦2.1M</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Potential savings identified</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">+15% vs last year</span>
                </div>
              </div>
            </div>
          </div>


      {/* Upcoming Contract Maturities */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Contract Maturities</h3>
          <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">CONTRACT</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">MATURITY DATE</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">OUTSTANDING LIABILITY</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">DAYS TO MATURITY</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMaturities.map((contract, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-4 px-4 text-sm text-slate-800 dark:text-slate-200 font-medium">{contract.contract}</td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{contract.maturityDate}</td>
                  <td className="py-4 px-4 text-sm text-slate-800 dark:text-slate-200 text-right font-medium">
                    ₦{contract.liability.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 text-right">
                    {contract.daysToMaturity > 0 ? `${contract.daysToMaturity} days` : `${Math.abs(contract.daysToMaturity)} days overdue`}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contract.status === 'Urgent'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </div>
  );
}