import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string | number | ReactNode;
    subtext?: string | ReactNode;
    accentColor?: "blue" | "green" | "grey" | "red";
    icon?: string;
}

export default function StatCard({
    label,
    value,
    subtext,
    accentColor = "grey",
    icon
}: StatCardProps) {

    const colorMap = {
        blue: "text-[#002966]",
        green: "text-green-600",
        grey: "text-slate-600",
        red: "text-red-600",
    };

    return (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-4 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {label}
                </h3>
                {icon && (
                    <span className={`material-symbols-outlined text-xl opacity-50 group-hover:opacity-100 transition-opacity ${colorMap[accentColor]}`}>
                        {icon}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <div className={`text-4xl font-extrabold tracking-tight ${colorMap[accentColor]}`}>
                    {value}
                </div>
                {subtext && (
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    );
}
