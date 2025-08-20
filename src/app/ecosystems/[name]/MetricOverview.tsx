import clsx from "clsx";
import { Users, Code2, Zap, Database } from "lucide-react";

import MetricCard, { type MetricCardProps } from "$/controls/metric-card";

import type { MetricOverviewProps } from "./typing";

function resolveMetrics(dataSource: MetricOverviewProps["dataSource"]): MetricCardProps[] {
  return [
    {
      label: "Developers",
      value: Number(dataSource.developerCoreCount).toLocaleString(),
      icon: <Code2 size={20} className="text-secondary" />,
      iconBgClassName: "bg-secondary/10",
    },
    {
      label: "ECO Contributors",
      value: Number(dataSource.developerTotalCount).toLocaleString(),
      icon: <Users size={20} className="text-primary" />,
      iconBgClassName: "bg-primary/10",
    },
    {
      label: "New Developers",
      value: Number(dataSource.developerGrowthCount).toLocaleString(),
      icon: <Database size={20} className="text-warning" />,
      iconBgClassName: "bg-warning/10",
    },
    {
      label: "Repositories",
      value: Number(dataSource.repositoryTotalCount).toLocaleString(),
      icon: <Zap size={20} className="text-success" />,
      iconBgClassName: "bg-success/10",
    },
  ];
}

function MetricOverview({ className, dataSource }: MetricOverviewProps) {
  return (
    <div className={clsx("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6", className)}>
      {resolveMetrics(dataSource).map(metric => (
        <MetricCard key={metric.label.replaceAll(" ", "")} {...metric} />
      ))}
    </div>
  );
}

export default MetricOverview;
