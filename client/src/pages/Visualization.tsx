import { useWeatherList } from "@/hooks/use-weather";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, Legend 
} from "recharts";

export default function Visualization() {
  const { data, isLoading } = useWeatherList();

  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <div className="p-10 text-center">No data available for visualization.</div>;

  // Process data for charts (sort by date)
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), "MMM yyyy"),
      shortDate: format(new Date(item.date), "MM/yy"),
    }));

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Interactive graphical representation of temporal climate patterns.
        </p>
      </div>

      {/* Temperature Trend */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Temperature Timeline</CardTitle>
          <CardDescription>Fluctuations in surface temperature (°C) over the recorded period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="shortDate" 
                tick={{fill: '#6B7280', fontSize: 12}} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{fill: '#6B7280', fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                unit="°C"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#F59E0B" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Rainfall Bar Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Rainfall Volume</CardTitle>
            <CardDescription>Monthly precipitation levels (mm).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="shortDate" hide />
                <YAxis axisLine={false} tickLine={false} unit="mm" width={40} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="rainfall" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Humidity Area Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Relative Humidity</CardTitle>
            <CardDescription>Atmospheric moisture content (%).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="shortDate" hide />
                <YAxis axisLine={false} tickLine={false} unit="%" width={35} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#14B8A6" 
                  fillOpacity={1} 
                  fill="url(#colorHum)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 py-8">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    </div>
  );
}
