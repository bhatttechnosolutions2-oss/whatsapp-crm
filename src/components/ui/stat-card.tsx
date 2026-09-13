import React from "react";
import { cn } from "@/lib/utils";
import { StatCardProps } from "@/types/crm";

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  loading = false,
  className,
  valueColor = "text-blue-600",
}: StatCardProps & { valueColor?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl p-5 text-center transition-all hover:shadow-sm hover:border-gray-300",
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
          {icon}
        </div>
      )}

      {/* Value — big colored number like competitor */}
      {loading ? (
        <div className="h-9 w-16 animate-pulse rounded-md bg-gray-200 mx-auto" />
      ) : (
        <div className={cn("text-3xl font-bold tracking-tight", valueColor)}>
          {value}
        </div>
      )}

      {/* Title */}
      <p className="mt-1.5 text-xs text-gray-500 font-medium">{title}</p>

      {/* Trend */}
      {trend && (
        <span
          className={cn(
            "mt-1 text-[11px] font-semibold",
            trend.isPositive ? "text-green-600" : "text-red-500"
          )}
        >
          {trend.isPositive ? "▲" : "▼"} {trend.value}%
        </span>
      )}
    </div>
  );
}
