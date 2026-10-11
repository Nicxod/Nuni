import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  badge,
  variant = "default",
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          valColor: "text-emerald-800",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-700 border-amber-200",
          valColor: "text-amber-800",
        };
      case "danger":
        return {
          iconBg: "bg-rose-50 text-rose-700 border-rose-200",
          valColor: "text-rose-800",
        };
      case "info":
        return {
          iconBg: "bg-blue-50 text-blue-700 border-blue-200",
          valColor: "text-blue-800",
        };
      default:
        return {
          iconBg: "bg-green-50 text-green-700 border-green-200",
          valColor: "text-gray-900",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-green-300 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold tracking-tight ${styles.valColor}`}>
              {typeof value === "number" ? value.toLocaleString("id-ID") : value}
            </span>
            {unit && <span className="text-xs font-semibold text-gray-500">{unit}</span>}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="truncate">{subtitle}</span>
        {badge}
      </div>
    </div>
  );
}
