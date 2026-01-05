import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsResponseType } from "@/types/api.type";

interface AnalyticsChartsProps {
    analytics: AnalyticsResponseType["analytics"] | undefined;
    isLoading: boolean;
}

const AnalyticsCharts = ({ analytics, isLoading }: AnalyticsChartsProps) => {
    if (isLoading || !analytics) {
        return <div>Loading charts...</div>;
    }

    const { last7Days, taskPriorityDistribution } = analytics;

    // Transform priority data for PieChart
    const priorityData = [
        { name: "Low", value: taskPriorityDistribution?.low || 0, color: "#82ca9d" },
        {
            name: "Medium",
            value: taskPriorityDistribution?.medium || 0,
            color: "#8884d8",
        },
        { name: "High", value: taskPriorityDistribution?.high || 0, color: "#ff8042" },
    ];

    return (
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2 mt-5">
            {/* Workplace Productivity (Last 7 Days) */}
            <Card>
                <CardHeader>
                    <CardTitle>Workplace Productivity (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last7Days}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#333", border: "none" }}
                                itemStyle={{ color: "#fff" }}
                            />
                            <Bar dataKey="count" fill="#3b82f6" name="Completed Tasks" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Task Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={priorityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyticsCharts;
