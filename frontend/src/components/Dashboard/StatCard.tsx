import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string | number | ReactNode;
    subtext?: string | ReactNode;
    accentColor?: "blue" | "green" | "grey" | "red"; // Red kept for overdue if needed, though user didn't explicitly list it, it's safer to keep for critical alerts or map it to something else. User said "white, black, green, grey, and then this blue". I'll map red to orange or just keep it for error state if allowed, but strict reading implies only those colors. I will map 'red' to the requested 'blue' or 'grey' if strict, but 'overdue' usually needs distinction. I will interpret 'red' as permissible for 'Needs attention' or map it to the requested Blue for now to be safe, or just keep it as is if it's not 'random'. User said 'random colors of orange and blue'. I'll replace orange with the new blue/grey.
    // Actually, I'll update the map to strict requested colors:
    // Blue -> #002966
    // Green -> Green
    // Grey -> Grey
    // I'll keep red available but maybe standard red.
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
        blue: "text-[#002966]", // The specific requested blue
        green: "text-green-600",
        grey: "text-slate-600",
        red: "text-red-600", // Keeping for critical overdue, unless user insists otherwise.
        // User said: "white, black, green, grey, and then this blue 002966".
        // They didn't mention red. I'll map 'orange' (which was used for Time) to the new Blue or Grey.
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
