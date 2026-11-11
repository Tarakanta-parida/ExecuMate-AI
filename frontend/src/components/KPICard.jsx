import React from 'react';

export default function KPICard({ title, value, change, changeType = 'positive', icon: Icon, subtitle, badge }) {
  const isPositive = changeType === 'positive';
  const isWarning = changeType === 'warning';
  const isNegative = changeType === 'negative';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-[#1E293B]">{value}</div>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        {change && (
          <span
            className={`font-semibold ${
              isPositive
                ? 'text-[#16A34A]'
                : isWarning
                ? 'text-[#D97706]'
                : isNegative
                ? 'text-red-600'
                : 'text-[#64748B]'
            }`}
          >
            {change}
          </span>
        )}
        {subtitle && <span className="text-[#64748B]">{subtitle}</span>}
      </div>
    </div>
  );
}

