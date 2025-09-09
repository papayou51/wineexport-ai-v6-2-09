import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { Brain } from 'lucide-react';

interface ProviderUsageChartProps {
  data?: Array<{
    provider: string;
    usage: number;
    color: string;
  }>;
}

const chartConfig = {
  usage: {
    label: "Utilisation",
  },
  openai: {
    label: "OpenAI",
    color: "hsl(var(--primary))",
  },
  anthropic: {
    label: "Anthropic",
    color: "hsl(var(--success))",
  },
  google: {
    label: "Google",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export const ProviderUsageChart = ({ data }: ProviderUsageChartProps) => {
  // Données factices si pas de données
  const mockData = [
    { provider: 'openai', usage: 45, color: 'hsl(var(--primary))' },
    { provider: 'anthropic', usage: 35, color: 'hsl(var(--success))' },
    { provider: 'google', usage: 20, color: 'hsl(var(--accent))' },
  ];

  const chartData = data || mockData;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Répartition Providers IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="usage"
              nameKey="provider"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="stroke-background hover:opacity-80"
                />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="provider" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
        
        {/* Stats numériques */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {chartData.map((item) => (
            <div key={item.provider} className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {item.usage}%
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {item.provider}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};