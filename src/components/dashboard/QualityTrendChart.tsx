import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface QualityTrendChartProps {
  data?: Array<{
    date: string;
    quality: number;
    avgResponseTime: number;
  }>;
}

const chartConfig = {
  quality: {
    label: "Qualité (%)",
    color: "hsl(var(--success))",
  },
  avgResponseTime: {
    label: "Temps (s)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export const QualityTrendChart = ({ data }: QualityTrendChartProps) => {
  // Données factices si pas de données
  const mockData = [
    { date: '2024-01-01', quality: 85, avgResponseTime: 4.2 },
    { date: '2024-01-02', quality: 88, avgResponseTime: 3.8 },
    { date: '2024-01-03', quality: 82, avgResponseTime: 5.1 },
    { date: '2024-01-04', quality: 91, avgResponseTime: 3.2 },
    { date: '2024-01-05', quality: 89, avgResponseTime: 3.9 },
    { date: '2024-01-06', quality: 86, avgResponseTime: 4.5 },
    { date: '2024-01-07', quality: 93, avgResponseTime: 2.8 },
  ];

  const chartData = data || mockData;
  
  // Calcul de la tendance
  const currentQuality = chartData[chartData.length - 1]?.quality || 0;
  const previousQuality = chartData[chartData.length - 2]?.quality || 0;
  const qualityTrend = currentQuality - previousQuality;
  
  const currentTime = chartData[chartData.length - 1]?.avgResponseTime || 0;
  const previousTime = chartData[chartData.length - 2]?.avgResponseTime || 0;
  const timeTrend = currentTime - previousTime;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Qualité & Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR', { 
                  day: 'numeric',
                  month: 'short' 
                });
              }}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="quality"
              type="monotone"
              stroke="var(--color-quality)"
              strokeWidth={3}
              dot={{ fill: "var(--color-quality)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>

        {/* Indicateurs de tendance */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-card border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-lg font-bold text-success">
                {Math.round(currentQuality)}%
              </span>
              {qualityTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : qualityTrend < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">Qualité</div>
            {qualityTrend !== 0 && (
              <div className={`text-xs ${qualityTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qualityTrend > 0 ? '+' : ''}{Math.round(qualityTrend)}%
              </div>
            )}
          </div>

          <div className="text-center p-3 rounded-lg bg-card border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-lg font-bold text-accent">
                {currentTime.toFixed(1)}s
              </span>
              {timeTrend < 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : timeTrend > 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">Temps</div>
            {timeTrend !== 0 && (
              <div className={`text-xs ${timeTrend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {timeTrend > 0 ? '+' : ''}{timeTrend.toFixed(1)}s
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};