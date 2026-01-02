import { Box, Card, CardContent, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { DerivedTask, Task } from '@/types';
import { useMemo } from 'react';

interface Props {
  tasks: DerivedTask[];
}

const PRIORITIES: Task['priority'][] = ['High', 'Medium', 'Low'];
const STATUSES: Task['status'][] = ['Todo', 'In Progress', 'Done'];

export default function ChartsDashboard({ tasks }: Props) {
  const { revenueByPriority, revenueByStatus, roiBuckets } = useMemo(() => {
    const revenueByPriority = PRIORITIES.map(p => ({
      priority: p,
      revenue: tasks
        .filter(t => t.priority === p)
        .reduce((s, t) => s + t.revenue, 0),
    }));

    const revenueByStatus = STATUSES.map(s => ({
      status: s,
      revenue: tasks
        .filter(t => t.status === s)
        .reduce((s2, t) => s2 + t.revenue, 0),
    }));

    const roiBuckets = {
      lt200: 0,
      mid: 0,
      gt500: 0,
      na: 0,
    };

    tasks.forEach(t => {
      if (typeof t.roi !== 'number' || !Number.isFinite(t.roi)) {
        roiBuckets.na++;
      } else if (t.roi < 200) {
        roiBuckets.lt200++;
      } else if (t.roi <= 500) {
        roiBuckets.mid++;
      } else {
        roiBuckets.gt500++;
      }
    });

    return {
      revenueByPriority,
      revenueByStatus,
      roiBuckets: [
        { label: '<200', count: roiBuckets.lt200 },
        { label: '200–500', count: roiBuckets.mid },
        { label: '>500', count: roiBuckets.gt500 },
        { label: 'N/A', count: roiBuckets.na },
      ],
    };
  }, [tasks]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Insights
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Revenue by Priority
            </Typography>
            <BarChart
              height={240}
              xAxis={[{ scaleType: 'band', data: revenueByPriority.map(d => d.priority) }]}
              series={[{ data: revenueByPriority.map(d => d.revenue), color: '#4F6BED' }]}
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Revenue by Status
            </Typography>
            <PieChart
              height={240}
              series={[
                {
                  data: revenueByStatus.map((d, i) => ({
                    id: i,
                    label: d.status,
                    value: d.revenue,
                  })),
                },
              ]}
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              ROI Distribution
            </Typography>
            <BarChart
              height={240}
              xAxis={[{ scaleType: 'band', data: roiBuckets.map(b => b.label) }]}
              series={[{ data: roiBuckets.map(b => b.count), color: '#22A699' }]}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
