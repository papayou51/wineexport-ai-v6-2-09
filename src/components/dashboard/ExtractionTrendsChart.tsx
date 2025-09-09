import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ExtractionTrendsChartProps {
  data?: Array<{
    date: string;
    extractions: number;
    success: number;
    quality: number;
  }>;
}

const chartConfig = {
  extractions: {
    label: "Extractions",
    color: "hsl(var(--primary))",
  },
  success: {
    label: "Succès",
    color: "hsl(var(--success))",
  },
  quality: {
    label: "Qualité",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export const ExtractionTrendsChart = ({ data }: ExtractionTrendsChartProps) => {
  // Données factices si pas de données
  const mockData = [
    { date: '2024-01-01', extractions: 12, success: 10, quality: 85 },
    { date: '2024-01-02', extractions: 18, success: 16, quality: 88 },
    { date: '2024-01-03', extractions: 15, success: 13, quality: 82 },
    { date: '2024-01-04', extractions: 22, success: 20, quality: 91 },
    { date: '2024-01-05', extractions: 25, success: 23, quality: 89 },
    { date: '2024-01-06', extractions: 19, success: 17, quality: 86 },
    { date: '2024-01-07', extractions: 28, success: 26, quality: 93 },
  ];

  const chartData = data || mockData;

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendances d'Extraction (7 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillExtractions" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-extractions)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-extractions)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-success)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-success)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
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
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="success"
              type="natural"
              fill="url(#fillSuccess)"
              fillOpacity={0.4}
              stroke="var(--color-success)"
              strokeWidth={2}
            />
            <Area
              dataKey="extractions"
              type="natural"
              fill="url(#fillExtractions)"
              fillOpacity={0.4}
              stroke="var(--color-extractions)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};