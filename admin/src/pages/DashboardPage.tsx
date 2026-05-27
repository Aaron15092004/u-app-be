import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users, Dumbbell, Apple, Activity, RefreshCw } from 'lucide-react';
import { useStats } from '@/features/stats/useStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const BMI_COLORS = ['#64B5F6', '#4CAF50', '#FFA726', '#EF5350'];

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  sub?: string;
  loading: boolean;
}

function StatCard({ title, value, icon, sub, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-3xl font-bold">{value?.toLocaleString('vi-VN') ?? '—'}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isPending, isError, refetch } = useStats();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>
          <p className="text-muted-foreground text-sm">Số liệu thống kê toàn bộ ứng dụng</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng người dùng"
          value={data?.totalUsers}
          icon={<Users className="h-5 w-5" />}
          sub={data ? `${data.activeUsers} hoạt động · ${data.bannedUsers} bị khóa` : undefined}
          loading={isPending}
        />
        <StatCard
          title="Bài tập"
          value={data?.totalExercises}
          icon={<Dumbbell className="h-5 w-5" />}
          loading={isPending}
        />
        <StatCard
          title="Thực phẩm"
          value={data?.totalFoodItems}
          icon={<Apple className="h-5 w-5" />}
          loading={isPending}
        />
        <StatCard
          title="Lượt tập luyện"
          value={data?.totalWorkouts}
          icon={<Activity className="h-5 w-5" />}
          sub="Tổng tất cả người dùng"
          loading={isPending}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New users bar chart — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Người dùng mới (7 ngày gần nhất)</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.newUsersLast7Days ?? []} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [v, 'Người dùng mới']}
                    contentStyle={{ fontSize: 13 }}
                  />
                  <Bar dataKey="count" fill="#4CAF50" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* BMI distribution pie — 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố BMI</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-56 w-full" />
            ) : !data?.bmiDistribution.length ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu BMI
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.bmiDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    label={({ name, percent }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.bmiDistribution.map((_, i) => (
                      <Cell key={i} fill={BMI_COLORS[i % BMI_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Người dùng']} contentStyle={{ fontSize: 13 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trạng thái tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Hoạt động', value: data?.activeUsers ?? 0 },
                  { name: 'Bị khóa', value: data?.bannedUsers ?? 0 },
                ]}
                margin={{ top: 0, right: 40, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13 }} width={70} />
                <Tooltip formatter={(v) => [v, 'Tài khoản']} contentStyle={{ fontSize: 13 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={36}>
                  <Cell fill="#4CAF50" />
                  <Cell fill="#EF5350" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
