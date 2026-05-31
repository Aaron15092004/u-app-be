import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Apple,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Dumbbell,
  Droplet,
  Flame,
  Flashlight,
  Heart,
  Home as HomeIcon,
  Leaf,
  LockOpen,
  Mail,
  Minus,
  PersonStanding,
  QrCode,
  RefreshCw,
  Ruler,
  Scale,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Utensils,
} from 'lucide-react';
import {
  API_URL,
  AuthUser,
  FoodLog,
  GoalType,
  HabitId,
  MilkFlavor,
  ProgramDetail,
  ProgramSummary,
  ScanResult,
  checkInHabit,
  clearAuth,
  completeProfile,
  completeSession,
  createSession,
  deleteFoodLog,
  dismissRating,
  errorMessage,
  forgotPassword,
  getEntitlement,
  getFoodLogs,
  getFoodLogsRange,
  getHabitsToday,
  getHabitStreak,
  getMilkRecommendations,
  getProfileStats,
  getProgram,
  getRatingStatus,
  getShopUrl,
  getStoredAuth,
  getTodaySummary,
  getWeeklyHabits,
  getWeeklyWorkoutStats,
  getWorkoutStreak,
  listPrograms,
  logWater,
  login,
  lookupBarcode,
  redeemCode,
  register,
  resetPassword,
  saveBmi,
  saveFoodLog,
  scanFood,
  selectMilk,
  startProgram,
  storeAuth,
  submitRating,
  updateNotifications,
  updateProfile,
  updateStoredUser,
  googleLogin,
} from './api';
import { Button, Field, IconActionCard, Metric, Toggle, classNames } from './components/ui';
import { IntroOnboarding } from './pages/IntroOnboarding';
import './styles.css';

type Page = 'home' | 'scan' | 'food' | 'bmi' | 'workouts' | 'habits' | 'profile' | 'notifications';
type LoadState = 'idle' | 'loading' | 'error';
type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type FoodPeriod = 'day' | 'week' | 'month';

const INTRO_KEY = 'u_web_seen_intro';

const goalLabel: Record<GoalType, string> = {
  lose: 'Giảm cân',
  maintain: 'Duy trì cân nặng',
  gain: 'Tăng cân / Tăng cơ',
};

const habitLabels: Record<HabitId, string> = {
  water: 'Uống nước',
  vegetables: 'Ăn rau',
  exercise: 'Tập luyện',
  sleep: 'Ngủ đủ',
  reading: 'Đọc sách',
  'nut-milk': 'Sữa Ủ',
};

const VITAMIN_META: Record<string, { label: string; unit: string }> = {
  vitaminA: { label: 'Vitamin A', unit: 'mcg' },
  vitaminB1: { label: 'Vitamin B1', unit: 'mg' },
  vitaminB2: { label: 'Vitamin B2', unit: 'mg' },
  vitaminB3: { label: 'Vitamin B3', unit: 'mg' },
  vitaminB6: { label: 'Vitamin B6', unit: 'mg' },
  vitaminB12: { label: 'Vitamin B12', unit: 'mcg' },
  vitaminC: { label: 'Vitamin C', unit: 'mg' },
  vitaminD: { label: 'Vitamin D', unit: 'mcg' },
  vitaminE: { label: 'Vitamin E', unit: 'mg' },
  vitaminK: { label: 'Vitamin K', unit: 'mcg' },
  folate: { label: 'Folate', unit: 'mcg' },
};

const MINERAL_META: Record<string, { label: string; unit: string }> = {
  calcium: { label: 'Canxi', unit: 'mg' },
  iron: { label: 'Sắt', unit: 'mg' },
  magnesium: { label: 'Magie', unit: 'mg' },
  phosphorus: { label: 'Phốt pho', unit: 'mg' },
  potassium: { label: 'Kali', unit: 'mg' },
  sodium: { label: 'Natri', unit: 'mg' },
  zinc: { label: 'Kẽm', unit: 'mg' },
  copper: { label: 'Đồng', unit: 'mg' },
  manganese: { label: 'Mangan', unit: 'mg' },
  selenium: { label: 'Selen', unit: 'mcg' },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function mondayOf(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - (r.getDay() === 0 ? 6 : r.getDay() - 1));
  return r;
}

function foodRange(period: FoodPeriod, offset: number) {
  const today = new Date();
  if (period === 'day') {
    const d = addDays(today, offset);
    return {
      from: toYmd(d),
      to: toYmd(d),
      label: offset === 0 ? 'Hôm nay' : offset === -1 ? 'Hôm qua' : `${d.getDate()}/${d.getMonth() + 1}`,
    };
  }
  if (period === 'week') {
    const start = addDays(mondayOf(today), offset * 7);
    const end = addDays(start, 6);
    return { from: toYmd(start), to: toYmd(end), label: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}` };
  }
  const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return {
    from: toYmd(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: toYmd(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
    label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
  };
}

function bmiOf(user: AuthUser | null): number | null {
  const h = user?.profile?.heightCm;
  const w = user?.profile?.weightKg;
  if (!h || !w) return null;
  return Number((w / (h / 100) ** 2).toFixed(1));
}

function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState('');

  const reload = async () => {
    setState('loading');
    setError('');
    try {
      setData(await fn());
      setState('idle');
    } catch (err) {
      setError(errorMessage(err));
      setState('error');
    }
  };

  useEffect(() => {
    void reload();
  }, deps);

  return { data, state, error, reload };
}

function Shell({
  page,
  setPage,
  user,
  children,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  user: AuthUser;
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const nav: Array<{ id: Page; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Trang chủ', icon: <HomeIcon size={22} /> },
    { id: 'food', label: 'Bữa ăn', icon: <Utensils size={22} /> },
    { id: 'workouts', label: 'Tập luyện', icon: <Dumbbell size={22} /> },
    { id: 'habits', label: 'Thói quen', icon: <CheckCircle2 size={22} /> },
    { id: 'profile', label: 'Cá nhân', icon: <User size={22} /> },
  ];
  return (
    <div className="mobile-stage">
      <div className="app-shell">
        <main className="main">{children}</main>
        <nav className="bottom-tabs">
          {nav.map((item) => (
            <button key={item.id} className={classNames('nav-item', page === item.id && 'active')} onClick={() => setPage(item.id)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Không tải được Google Identity.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không tải được Google Identity.'));
    document.head.appendChild(script);
  });
}

function AuthScreen({ onAuth, initialMode }: { onAuth: (user: AuthUser) => void; initialMode: 'login' | 'register' }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setNotice('');
    try {
      if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setNotice(res.message);
        setMode('reset');
        return;
      }
      if (mode === 'reset') {
        const res = await resetPassword(resetToken, password);
        setNotice(res.message);
        setMode('login');
        return;
      }
      const auth = mode === 'login' ? await login(email, password) : await register(email, password);
      onAuth(auth.user);
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!googleClientId) {
      setErr('Web Google Login cần cấu hình VITE_GOOGLE_CLIENT_ID.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await loadGoogleIdentity();
      window.google!.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setBusy(false);
            setErr('Google không trả về credential.');
            return;
          }
          try {
            const auth = await googleLogin(response.credential);
            onAuth(auth.user);
          } catch (error) {
            setErr(errorMessage(error));
          } finally {
            setBusy(false);
          }
        },
      });
      window.google!.accounts.id.prompt();
    } catch (error) {
      setErr(errorMessage(error));
      setBusy(false);
    }
  }

  const title =
    mode === 'login'
      ? 'Đăng nhập'
      : mode === 'register'
        ? 'Tạo tài khoản'
        : mode === 'forgot'
          ? 'Quên mật khẩu'
          : 'Đặt lại mật khẩu';

  return (
    <div className="mobile-stage">
      <form className="auth-card" onSubmit={submit}>
        <div className="screen-header">
          <button className="back-dot" type="button" onClick={() => setMode('login')}>‹</button>
          <h1>{title}</h1>
          <p>Chào mừng trở lại! Tiếp tục hành trình sức khỏe của bạn</p>
        </div>
        <h2>{title}</h2>
        {mode !== 'reset' && <Field label="Email" value={email} onChange={setEmail} type="email" />}
        {mode === 'reset' && <Field label="Token đặt lại mật khẩu" value={resetToken} onChange={setResetToken} />}
        {mode !== 'forgot' && <Field label={mode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'} value={password} onChange={setPassword} type="password" />}
        {err && <p className="error">{err}</p>}
        {notice && <p className="success">{notice}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký' : mode === 'forgot' ? 'Gửi email' : 'Đặt lại mật khẩu'}
        </Button>
        {mode === 'login' && (
          <>
            <Button variant="ghost" onClick={signInWithGoogle} disabled={busy}><Sparkles size={18} /> Đăng nhập Google</Button>
            <p className="muted compact-note">Apple Sign-In web cần cấu hình Apple Services ID riêng trước khi bật.</p>
          </>
        )}
        <button className="link-btn" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Về đăng nhập'}
        </button>
        {mode === 'login' && <button className="link-btn" type="button" onClick={() => setMode('forgot')}>Quên mật khẩu?</button>}
      </form>
    </div>
  );
}

function Onboarding({ user, onDone }: { user: AuthUser; onDone: (u: AuthUser) => void }) {
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.profile?.age || 22);
  const [height, setHeight] = useState(user.profile?.heightCm || 160);
  const [weight, setWeight] = useState(user.profile?.weightKg || 50);
  const [goalType, setGoalType] = useState<GoalType>(user.profile?.goalType || 'maintain');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const next = await completeProfile({ name, age: Number(age), heightCm: Number(height), weightKg: Number(weight), goalType });
      onDone(next);
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mobile-stage">
      <form className="phone-panel" onSubmit={submit}>
        <div className="profile-form-header">
          <h1>Hoàn thiện hồ sơ</h1>
          <p>Để cá nhân hoá trải nghiệm, hãy cho chúng tôi biết thêm về bạn.</p>
        </div>
        <Field label="Họ và tên" value={name} onChange={setName} />
        <div className="grid2">
          <Field label="Tuổi" value={age} onChange={(v) => setAge(Number(v))} type="number" />
          <Field label="Chiều cao (cm)" value={height} onChange={(v) => setHeight(Number(v))} type="number" />
          <Field label="Cân nặng (kg)" value={weight} onChange={(v) => setWeight(Number(v))} type="number" />
        </div>
        <span className="goal-label">Mục tiêu của bạn</span>
        <div className="goal-row">
          {Object.entries(goalLabel).map(([key, label]) => (
            <button
              className={classNames('goal-card', goalType === key && 'selected')}
              key={key}
              type="button"
              onClick={() => setGoalType(key as GoalType)}
            >
              <span>{key === 'lose' ? <TrendingDown size={24} /> : key === 'gain' ? <TrendingUp size={24} /> : <Minus size={24} />}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>
        {err && <p className="error">{err}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Đang lưu...' : 'Bắt đầu'}</Button>
      </form>
    </div>
  );
}

function Home({ setPage }: { setPage: (p: Page) => void }) {
  const summary = useAsync(getTodaySummary, []);
  const stats = useAsync(getProfileStats, []);
  const shop = useAsync(getShopUrl, []);
  const [busy, setBusy] = useState(false);
  const data = summary.data;

  async function addWater() {
    setBusy(true);
    try {
      await logWater();
      void summary.reload();
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <div>
          <h1>Xin chào, bạn!</h1>
          <p>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="bell-button" onClick={() => setPage('notifications')} aria-label="Thông báo"><Bell size={24} /></button>
        <TodaySummaryCard
          kcal={data?.kcalConsumed ?? 0}
          waterGlasses={data?.waterGlasses ?? 0}
          waterGoal={data?.waterGoal ?? 8}
          workoutMinutes={data?.workoutMinutes ?? 0}
          onWaterPress={addWater}
          isLoading={summary.state === 'loading'}
        />
      </div>
      {summary.error && <p className="error">{summary.error}</p>}
      <h2 className="mobile-section-title">Hành động nhanh</h2>
      <div className="quick-actions-row">
        <QuickAction icon={<Camera size={28} />} label="Quét bữa ăn" bg="#E8F5E9" color="#4CAF50" onClick={() => setPage('scan')} />
        <QuickAction icon={<Dumbbell size={28} />} label="Bắt đầu tập" bg="#FFF3E0" color="#FF6B35" onClick={() => setPage('workouts')} />
        <QuickAction icon={<CheckCircle2 size={28} />} label="Thói quen" bg="#E3F2FD" color="#2196F3" onClick={() => setPage('habits')} />
      </div>
      <WaterCard
        glasses={data?.waterGlasses ?? 0}
        goal={data?.waterGoal ?? 8}
        onAdd={addWater}
        isAdding={busy}
      />
      <BMIHomeWidget bmi={data?.bmi ?? null} onPress={() => setPage('bmi')} />
      <NutritionCard
        kcal={data?.kcalConsumed ?? 0}
        macros={data?.macros ?? { protein: 0, carbs: 0, fat: 0 }}
        kcalGoal={stats.data?.dailyTargets.kcal ?? 2000}
        macroGoals={stats.data?.dailyTargets ?? { protein: 100, carbs: 250, fat: 67, kcal: 2000 }}
        onSeeMore={() => setPage('food')}
      />
      <ShopBannerWeb url={shop.data?.url ?? null} isLoading={shop.state === 'loading'} />
    </div>
  );
}

function TodaySummaryCard({
  kcal,
  waterGlasses,
  waterGoal,
  workoutMinutes,
  onWaterPress,
  isLoading,
}: {
  kcal: number;
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  onWaterPress: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="home-stats-card"><span>Tổng quan hôm nay</span><div className="stats-skeleton-row"><i /><i /><i /></div></div>;
  }
  return (
    <div className="home-stats-card">
      <span>Tổng quan hôm nay</span>
      <div className="today-summary-row">
        <SummaryCol icon={<Flame size={22} />} color="#FF6B35" value={Math.round(kcal).toLocaleString('vi-VN')} unit="kcal" />
        <button onClick={onWaterPress}>
          <SummaryCol icon={<Droplet size={22} />} color="#42A5F5" value={`${waterGlasses}/${waterGoal}`} unit="cốc" />
        </button>
        <SummaryCol icon={<Flashlight size={22} />} color="#FFA726" value={workoutMinutes} unit="phút" />
      </div>
    </div>
  );
}

function SummaryCol({ icon, color, value, unit }: { icon: React.ReactNode; color: string; value: React.ReactNode; unit: string }) {
  return <div className="summary-col" style={{ ['--summary-color' as string]: color }}>{icon}<strong>{value}</strong><small>{unit}</small></div>;
}

function QuickAction({ icon, label, bg, color, onClick }: { icon: React.ReactNode; label: string; bg: string; color: string; onClick: () => void }) {
  return <button className="quick-action" style={{ backgroundColor: bg, color }} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function WaterCard({ glasses, goal, onAdd, isAdding }: { glasses: number; goal: number; onAdd: () => void; isAdding: boolean }) {
  const pct = goal > 0 ? Math.min(1, glasses / goal) : 0;
  const done = glasses >= goal;
  return (
    <section className="water-card">
      <div className="water-card-head">
        <div className="water-icon"><Droplet size={18} /></div>
        <div>
          <strong>Uống nước</strong>
          <span>{glasses}/{goal} ly hôm nay</span>
        </div>
        {done ? (
          <CheckCircle2 className="water-done" size={24} />
        ) : (
          <button onClick={onAdd} disabled={isAdding}><span>+</span> 1 ly</button>
        )}
      </div>
      <div className="water-track"><i style={{ width: `${Math.round(pct * 100)}%` }} /></div>
      <div className="glass-row">
        {Array.from({ length: Math.min(goal, 10) }).map((_, i) => <Droplet key={i} size={16} className={i < glasses ? 'filled' : ''} />)}
        {goal > 10 && <small>+{goal - 10}</small>}
      </div>
    </section>
  );
}

function BMIHomeWidget({ bmi, onPress }: { bmi: { value: number; category: string } | null; onPress: () => void }) {
  const categoryLabel = bmi?.category === 'underweight' ? 'Thiếu cân' : bmi?.category === 'normal' ? 'Bình thường' : bmi?.category === 'overweight' ? 'Thừa cân' : bmi?.category === 'obese' ? 'Béo phì' : '';
  const message = bmi?.category === 'underweight'
    ? 'Hãy bổ sung dinh dưỡng để đạt cân nặng lý tưởng'
    : bmi?.category === 'normal'
      ? 'Bạn đang ở mức khỏe mạnh, hãy duy trì nhé!'
      : bmi?.category === 'overweight'
        ? 'Tiếp tục vận động để cải thiện sức khỏe'
        : bmi?.category === 'obese'
          ? 'Hãy tham khảo chuyên gia để có kế hoạch phù hợp'
          : '';
  return (
    <button className="bmi-widget" onClick={onPress}>
      <div className="bmi-widget-head">
        <div><strong>Chỉ số BMI</strong><span>{bmi ? 'Cập nhật hôm nay' : 'Chưa có dữ liệu'}</span></div>
        <Heart size={22} />
      </div>
      {bmi ? (
        <>
          <div className="bmi-widget-value"><b>{bmi.value.toFixed(1)}</b><span>{categoryLabel}</span></div>
          <p>{message}</p>
        </>
      ) : (
        <p className="bmi-update">Nhấn để cập nhật BMI →</p>
      )}
    </button>
  );
}

function NutritionCard({
  kcal,
  macros,
  kcalGoal,
  macroGoals,
  onSeeMore,
}: {
  kcal: number;
  macros: { protein: number; carbs: number; fat: number };
  kcalGoal: number;
  macroGoals: { kcal?: number; protein: number; carbs: number; fat: number };
  onSeeMore: () => void;
}) {
  return (
    <section className="nutrition-card">
      <div className="nutrition-title-row">
        <h2>Dinh dưỡng hôm nay</h2>
        <button onClick={onSeeMore}>Xem chi tiết →</button>
      </div>
      <Ring value={kcal} goal={kcalGoal} size={128} stroke={11} color={kcal > kcalGoal ? '#EF5350' : '#B7CD65'} label="kcal" large />
      <div className="macro-ring-row">
        <MacroRing label="Protein" value={macros.protein} goal={macroGoals.protein} color="#4CAF50" />
        <MacroRing label="Carbs" value={macros.carbs} goal={macroGoals.carbs} color="#FF6B35" />
        <MacroRing label="Chất béo" value={macros.fat} goal={macroGoals.fat} color="#FFA726" />
      </div>
    </section>
  );
}

function MacroRing({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return <div className="macro-ring-cell"><Ring value={value} goal={goal} size={72} stroke={7} color={value > goal ? '#EF5350' : color} label="g" /><small>/ {Math.round(goal)}g</small><span>{label}</span></div>;
}

function Ring({ value, goal, size, stroke, color, label, large }: { value: number; goal: number; size: number; stroke: number; color: string; label: string; large?: boolean }) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(Math.max(value / goal, 0), 1) : 0;
  const offset = circ * (1 - pct);
  return (
    <div className={classNames('ring', large && 'large')} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} stroke="#F0F0F0" strokeWidth={stroke} fill="none" />
        {pct > 0 && <circle cx={c} cy={c} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`} />}
      </svg>
      <div className="ring-center" style={{ color }}>
        <strong>{Math.round(value).toLocaleString('vi-VN')}</strong>
        <span>{large ? `/ ${goal.toLocaleString('vi-VN')}` : label}</span>
        {large && <small>{label}</small>}
      </div>
    </div>
  );
}

function ShopBannerWeb({ url, isLoading }: { url: string | null; isLoading: boolean }) {
  if (url === null && !isLoading) return null;
  return (
    <section className="shop-banner" onClick={() => url && window.open(url, '_blank')}>
      <div>
        <h2>Ủ Shop</h2>
        <p>Khám phá combo sữa hạt & nước detox</p>
        <button disabled={!url}>Mua ngay →</button>
      </div>
      <img src="/assets/logo.png" alt="Ủ Shop" />
    </section>
  );
}

function ScanScreen() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [barcode, setBarcode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(next: File | null) {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : '');
  }

  async function runScan() {
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      setResult(await scanFood(file));
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    setBusy(true);
    try {
      await saveFoodLog(result);
      setMessage('Đã lưu bữa ăn.');
      setResult(null);
      pick(null);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function barcodeLookup() {
    if (!barcode.trim()) return;
    setBusy(true);
    try {
      const item = await lookupBarcode(barcode.trim());
      if (!item.found || !item.minimumNutrition) {
        setMessage(item.message || 'Chưa tìm thấy sản phẩm đủ dữ liệu.');
        return;
      }
      setResult({
        foods: [{
          name: item.minimumNutrition.name,
          calories: item.minimumNutrition.calories,
          protein: item.minimumNutrition.protein,
          carbs: item.minimumNutrition.carbs,
          fat: item.minimumNutrition.fat,
          fiber: item.fiber || 0,
          sugar: item.sugar || 0,
          source: 'barcode',
          barcode,
          provenance: item.provenance || {},
        }],
        totals: item.minimumNutrition,
        aiProvider: 'manual',
        imageUrl: null,
        commentVi: item.message || 'Sản phẩm đã được tra cứu bằng mã vạch.',
      });
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen scan-screen">
      <section className="scan-camera">
        <div className="scan-topbar">
          <button type="button"><ChevronLeft size={26} /></button>
          <div>
            <h1>Quét bữa ăn</h1>
            <p>Chụp ảnh để phân tích dinh dưỡng</p>
          </div>
        </div>
        <div className="scan-frame">
          {preview ? <img className="meal-preview" src={preview} alt="Ảnh món ăn" /> : <span><Camera size={52} /></span>}
        </div>
        <h1>Upload ảnh để AI phân tích</h1>
        <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] || null)} />
        <Button onClick={runScan} disabled={!file || busy}>{busy ? <><RefreshCw size={18} /> Đang phân tích...</> : <><Camera size={18} /> Phân tích ảnh</>}</Button>
        <div className="divider" />
        <Field label="Tra barcode thủ công" value={barcode} onChange={setBarcode} placeholder="Nhập mã vạch" />
        <Button variant="soft" onClick={barcodeLookup} disabled={busy}><QrCode size={18} /> Tra mã vạch</Button>
        {message && <p className={message.includes('Đã') ? 'success' : 'error'}>{message}</p>}
      </section>
      <section className="card result-card">
        <h2>Kết quả</h2>
        {result ? <FoodResult result={result} onSave={save} busy={busy} /> : <p className="muted">Kết quả phân tích sẽ hiển thị tại đây.</p>}
      </section>
    </div>
  );
}

function FoodResult({ result, onSave, busy }: { result: ScanResult; onSave: () => void; busy: boolean }) {
  return (
    <div className="result">
      <div className="metric-grid compact">
        <Metric label="Năng lượng" value={Math.round(result.totals.calories)} unit="kcal" />
        <Metric label="Đạm" value={Math.round(result.totals.protein)} unit="g" />
        <Metric label="Carb" value={Math.round(result.totals.carbs)} unit="g" />
        <Metric label="Béo" value={Math.round(result.totals.fat)} unit="g" />
      </div>
      {result.commentVi && <div className="notice"><strong>Nhận xét nhanh</strong><span>{result.commentVi}</span></div>}
      <div className="food-list">
        {result.foods.map((food, index) => (
          <div className="food-row" key={`${food.name}-${index}`}>
            <div><strong>{food.name}</strong><small>{food.weightG ? `${food.weightG}g` : food.source || 'ai_scan'}</small></div>
            <b>{Math.round(food.calories)} kcal</b>
          </div>
        ))}
      </div>
      <Button onClick={onSave} disabled={busy}>Lưu bữa ăn</Button>
    </div>
  );
}

function FoodDiary({ setPage }: { setPage: (p: Page) => void }) {
  const [period, setPeriod] = useState<FoodPeriod>('day');
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<FoodLog | null>(null);
  const range = useMemo(() => foodRange(period, offset), [period, offset]);
  const logs = useAsync(() => period === 'day' ? getFoodLogs(range.from) : Promise.resolve([]), [period, range.from]);
  const rangeLogs = useAsync(() => period !== 'day' ? getFoodLogsRange(range.from, range.to) : Promise.resolve([]), [period, range.from, range.to]);
  const stats = useAsync(getProfileStats, []);
  const kcalGoal = stats.data?.dailyTargets.kcal ?? 2000;

  const summary = useMemo(() => {
    if (period === 'day') {
      const items = logs.data || [];
      return {
        calories: items.reduce((sum, log) => sum + (log.totals?.calories || 0), 0),
        protein: items.reduce((sum, log) => sum + (log.totals?.protein || 0), 0),
        carbs: items.reduce((sum, log) => sum + (log.totals?.carbs || 0), 0),
        fat: items.reduce((sum, log) => sum + (log.totals?.fat || 0), 0),
        fiber: items.reduce((sum, log) => sum + log.foods.reduce((s, f) => s + (f.fiber || 0), 0), 0),
        activeDays: 1,
      };
    }
    const days = rangeLogs.data || [];
    const activeDays = days.filter((d) => d.calories > 0).length || 1;
    return {
      calories: days.reduce((sum, d) => sum + d.calories, 0),
      protein: days.reduce((sum, d) => sum + d.protein, 0),
      carbs: days.reduce((sum, d) => sum + d.carbs, 0),
      fat: days.reduce((sum, d) => sum + d.fat, 0),
      fiber: days.reduce((sum, d) => sum + d.fiber, 0),
      activeDays,
    };
  }, [period, logs.data, rangeLogs.data]);

  async function remove(id: string) {
    await deleteFoodLog(id);
    void logs.reload();
  }

  return (
    <div className="screen food-screen">
      <div className="food-header">
        <div className="food-header-top">
          <div>
            <h1>Bữa ăn</h1>
            <p>{range.label}</p>
          </div>
          <button onClick={() => setPage('scan')}><Camera size={20} /></button>
        </div>
        <div className="food-segmented">
          {[
            ['day', 'Ngày'],
            ['week', 'Tuần'],
            ['month', 'Tháng'],
          ].map(([key, label]) => (
            <button key={key} className={period === key ? 'active' : ''} onClick={() => { setPeriod(key as FoodPeriod); setOffset(0); }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="food-date-nav">
        <button onClick={() => setOffset((o) => o - 1)}><ChevronLeft size={18} /></button>
        <strong>{range.label}</strong>
        <button disabled={offset >= 0} onClick={() => setOffset((o) => Math.min(o + 1, 0))}><ChevronLeft size={18} className="right" /></button>
      </div>
      {(logs.error || rangeLogs.error) && <p className="error">{logs.error || rangeLogs.error}</p>}
      <FoodSummaryCard summary={summary} kcalGoal={kcalGoal} period={period} />
      {period !== 'day' && <FoodBarChart data={rangeLogs.data || []} kcalGoal={kcalGoal} />}
      {period !== 'day' && (
        <section className="food-day-list">
          <h2>Chi tiết từng ngày</h2>
          {(rangeLogs.data || []).map((d) => <FoodDayRow key={d.date} day={d} kcalGoal={kcalGoal} />)}
        </section>
      )}
      {period === 'day' && (
        <div className="meal-list">
          {(logs.data || []).map((log) => <MealCardWeb key={log._id} log={log} onOpen={() => setSelectedLog(log)} onDelete={() => remove(log._id)} />)}
          {logs.data?.length === 0 && <FoodEmptyState />}
        </div>
      )}
      {selectedLog && (
        <FoodDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onDelete={() => {
            void remove(selectedLog._id);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}

function FoodSummaryCard({ summary, kcalGoal, period }: { summary: { calories: number; protein: number; carbs: number; fat: number; fiber: number; activeDays: number }; kcalGoal: number; period: FoodPeriod }) {
  const d = Math.max(summary.activeDays, 1);
  const isDay = period === 'day';
  const cal = isDay ? summary.calories : summary.calories / d;
  const protein = isDay ? summary.protein : summary.protein / d;
  const carbs = isDay ? summary.carbs : summary.carbs / d;
  const fat = isDay ? summary.fat : summary.fat / d;
  const fiber = isDay ? summary.fiber : summary.fiber / d;
  const pct = Math.min(100, (cal / kcalGoal) * 100);
  return (
    <section className="food-summary-card">
      <div className="food-kcal-row">
        <div><strong>{Math.round(cal).toLocaleString('vi-VN')}</strong><span>{isDay ? `/ ${kcalGoal.toLocaleString('vi-VN')} kcal` : `tb/ngày · tổng ${Math.round(summary.calories).toLocaleString('vi-VN')} kcal`}</span></div>
        <div className="food-pill-stack">
          <FoodMacroPill label="Đạm" value={protein} color="#4CAF50" />
          <FoodMacroPill label="Carbs" value={carbs} color="#FF6B35" />
          <FoodMacroPill label="Béo" value={fat} color="#FFA726" />
          {fiber > 0 && <FoodMacroPill label="Xơ" value={fiber} color="#66BB6A" />}
        </div>
      </div>
      <div className="food-progress"><span style={{ width: `${pct}%` }} /></div>
    </section>
  );
}

function FoodMacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return <span className="food-macro-pill"><i style={{ backgroundColor: color }} />{Math.round(value)}g {label}</span>;
}

function FoodBarChart({ data, kcalGoal }: { data: Array<{ date: string; calories: number }>; kcalGoal: number }) {
  const max = Math.max(...data.map((d) => d.calories), 100);
  return (
    <section className="food-chart-card">
      <div><strong>Calo theo ngày</strong><span>Mục tiêu {kcalGoal.toLocaleString('vi-VN')} kcal</span></div>
      <div className="food-bars">
        {data.map((d) => {
          const h = d.calories > 0 ? Math.max(3, (d.calories / max) * 80) : 3;
          return <div className="food-bar-col" key={d.date}><i style={{ height: h }} /><small>{new Date(`${d.date}T12:00:00`).getDate()}</small></div>;
        })}
      </div>
    </section>
  );
}

function FoodDayRow({ day, kcalGoal }: { day: { date: string; calories: number }; kcalGoal: number }) {
  const pct = Math.min(100, (day.calories / kcalGoal) * 100);
  const date = new Date(`${day.date}T12:00:00`);
  return <div className="food-day-row"><div><small>{['CN','T2','T3','T4','T5','T6','T7'][date.getDay()]}</small><strong>{date.getDate()}</strong></div><span><i style={{ width: `${pct}%` }} /></span><b>{day.calories ? Math.round(day.calories) : '—'}</b></div>;
}

function MealCardWeb({ log, onOpen, onDelete }: { log: FoodLog; onOpen: () => void; onDelete: () => void }) {
  const time = new Date(log.createdAt || log.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="meal-card" onClick={onOpen}>
      <div className="meal-thumb">{log.imageUrl ? <img src={log.imageUrl} alt="" /> : <Utensils size={20} />}</div>
      <div className="meal-info">
        <small>{time}</small>
        <strong>{log.foods.map((f) => f.name).join(', ')}</strong>
        <span>{Math.round(log.totals.protein)}g đạm · {Math.round(log.totals.carbs)}g carbs · {Math.round(log.totals.fat)}g béo</span>
      </div>
      <div className="meal-cal"><b>{Math.round(log.totals.calories)}</b><small>kcal</small><button onClick={(event) => { event.stopPropagation(); onDelete(); }}>Xóa</button></div>
    </div>
  );
}

function FoodEmptyState() {
  return <div className="food-empty"><Utensils size={44} /><strong>Chưa có bữa ăn</strong><span>Quét ảnh để theo dõi dinh dưỡng của bạn</span></div>;
}

function FoodDetailModal({ log, onClose, onDelete }: { log: FoodLog; onClose: () => void; onDelete: () => void }) {
  const fiber = log.foods.reduce((sum, food) => sum + (food.fiber || 0), 0);
  const sugar = log.foods.reduce((sum, food) => sum + (food.sugar || 0), 0);
  const time = new Date(log.createdAt || log.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const vitamins = sumNutritionRecords(log.foods.map((food) => food.vitamins));
  const minerals = sumNutritionRecords(log.foods.map((food) => food.minerals));

  return (
    <div className="food-detail-backdrop" role="dialog" aria-modal="true">
      <div className="food-detail-sheet">
        <div className="food-detail-handle" />
        <div className="food-detail-header">
          <div>
            <small>{time}</small>
            <h2>{log.foods.map((f) => f.name).join(', ')}</h2>
          </div>
          <div className="food-detail-cal"><strong>{Math.round(log.totals.calories)}</strong><span>kcal</span></div>
        </div>
        <div className="food-detail-body">
          {log.imageUrl && <img className="food-detail-photo" src={log.imageUrl} alt="Ảnh bữa ăn" />}
          <h3>Dinh dưỡng chính</h3>
          <div className="nutrition-detail-card">
            <NutritionRow label="Năng lượng" value={log.totals.calories} unit="kcal" hero />
            <NutritionRow label="Chất đạm" value={log.totals.protein} unit="g" />
            <NutritionRow label="Tinh bột" value={log.totals.carbs} unit="g" />
            <NutritionRow label="Chất béo" value={log.totals.fat} unit="g" />
            {fiber > 0 && <NutritionRow label="Chất xơ" value={fiber} unit="g" />}
            {sugar > 0 && <NutritionRow label="Đường" value={sugar} unit="g" />}
          </div>
          {vitamins.length > 0 && (
            <>
              <h3>Vitamin</h3>
              <div className="nutrition-detail-card">
                {vitamins.map(([key, value]) => {
                  const meta = VITAMIN_META[key] || { label: key, unit: 'mg' };
                  return <NutritionRow key={key} label={meta.label} value={value} unit={meta.unit} />;
                })}
              </div>
            </>
          )}
          {minerals.length > 0 && (
            <>
              <h3>Khoáng chất</h3>
              <div className="nutrition-detail-card">
                {minerals.map(([key, value]) => {
                  const meta = MINERAL_META[key] || { label: key, unit: 'mg' };
                  return <NutritionRow key={key} label={meta.label} value={value} unit={meta.unit} />;
                })}
              </div>
            </>
          )}
          <h3>Chi tiết từng món</h3>
          <div className="nutrition-detail-card">
            {log.foods.map((food, index) => (
              <div className="food-breakdown-row" key={`${food.name}-${index}`}>
                <div><strong>{food.name}</strong>{food.weightG ? <small>{food.weightG}g</small> : null}</div>
                <b>{Math.round(food.calories)} kcal</b>
              </div>
            ))}
          </div>
          {log.commentVi && <div className="food-comment"><strong>Nhận xét nhanh</strong><span>{log.commentVi}</span></div>}
          <button className="delete-meal-btn" onClick={onDelete}><TrashIcon /> Xóa bữa ăn này</button>
        </div>
        <button className="close-sheet-btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

function sumNutritionRecords(records: Array<Record<string, number> | undefined>) {
  const totals = new Map<string, number>();
  for (const record of records) {
    if (!record) continue;
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== 'number' || value <= 0) continue;
      totals.set(key, (totals.get(key) || 0) + value);
    }
  }
  return Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function NutritionRow({ label, value, unit, hero }: { label: string; value: number; unit: string; hero?: boolean }) {
  const shown = Number.isInteger(value) ? Math.round(value).toString() : value.toFixed(1);
  return <div className={classNames('nutrition-row', hero && 'hero')}><span>{label}</span><div><strong>{shown}</strong><small>{unit}</small></div></div>;
}

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function BmiMilk({ user, setUser }: { user: AuthUser; setUser: (u: AuthUser) => void }) {
  const [height, setHeight] = useState(user.profile?.heightCm || 160);
  const [weight, setWeight] = useState(user.profile?.weightKg || 50);
  const bmi = Number((Number(weight) / (Number(height) / 100) ** 2).toFixed(1));
  const milk = useAsync(() => getMilkRecommendations({ bmi }), [bmi]);
  const [selected, setSelected] = useState('');
  const [msg, setMsg] = useState('');
  const recommended = milk.data?.flavors.find((f) => f.bmiRule === milk.data?.bmiRule) || milk.data?.flavors[0];

  useEffect(() => {
    setSelected(milk.data?.currentPreference?.selectedFlavorId || recommended?.flavorId || '');
  }, [milk.data?.currentPreference?.selectedFlavorId, recommended?.flavorId]);

  async function saveStats() {
    await saveBmi(Number(height), Number(weight));
    const profile = await updateProfile({ heightCm: Number(height), weightKg: Number(weight) });
    const next = { ...user, name: profile.name, profile: profile.profile };
    updateStoredUser(next);
    setUser(next);
    setMsg('Đã cập nhật BMI.');
  }

  async function saveMilk() {
    if (!selected) return;
    await selectMilk({ selectedFlavorId: selected, recommendedFlavorId: recommended?.flavorId, bmi, source: 'manual_profile' });
    setMsg('Đã lưu lựa chọn sữa Ủ.');
    void milk.reload();
  }

  return (
    <div className="screen">
      <div className="sub-gradient-header">
        <h1><BarChart3 size={24} /> Phân tích BMI</h1>
        <p>Theo dõi chỉ số cơ thể của bạn</p>
      </div>
      <section className="bmi-result">
        <span>BMI hiện tại</span>
        <strong>{bmi}</strong>
        <small>{bmi < 18.5 ? 'Thiếu cân' : bmi < 25 ? 'Bình thường' : bmi < 30 ? 'Thừa cân' : 'Béo phì'}</small>
      </section>
      <section className="card">
        <h2><Ruler size={20} /> Cập nhật số đo</h2>
        <div className="grid2">
          <Field label="Chiều cao (cm)" value={height} onChange={(v) => setHeight(Number(v))} type="number" />
          <Field label="Cân nặng (kg)" value={weight} onChange={(v) => setWeight(Number(v))} type="number" />
        </div>
        <Button onClick={saveStats}>Lưu BMI</Button>
        {msg && <p className="success">{msg}</p>}
      </section>
      <section className="card">
        <h2><Leaf size={20} /> Sữa Ủ phù hợp</h2>
        <h3>{recommended?.nameVi || 'Đang tải...'}</h3>
        <p>{recommended?.positioningVi}</p>
        <div className="milk-list">
          {(milk.data?.flavors || []).map((flavor) => (
            <button key={flavor.flavorId} className={classNames('milk-card', selected === flavor.flavorId && 'active')} onClick={() => setSelected(flavor.flavorId)}>
              <strong>{flavor.nameVi}</strong>
              <small>{flavor.positioningVi}</small>
            </button>
          ))}
        </div>
        <Button onClick={saveMilk} disabled={!selected}>Lưu lựa chọn</Button>
      </section>
    </div>
  );
}

function Workouts() {
  const [level, setLevel] = useState('all');
  const [programId, setProgramId] = useState('');
  const programs = useAsync(() => listPrograms(level), [level]);
  const program = useAsync(() => programId ? getProgram(programId) : Promise.resolve(null as ProgramDetail | null), [programId]);
  const stats = useAsync(getWeeklyWorkoutStats, []);
  const streak = useAsync(getWorkoutStreak, []);
  const [msg, setMsg] = useState('');

  async function start(id: string) {
    await startProgram(id);
    setMsg('Đã bắt đầu chương trình.');
    void programs.reload();
  }

  async function completeDay(detail: ProgramDetail, dayNumber: number) {
    const day = detail.days.find((d) => d.dayNumber === dayNumber);
    if (!day) return;
    const session = await createSession({
      programId: detail._id,
      dayNumber,
      dayTitle: day.title,
      exercises: day.exercises.map((e) => ({
        name: e.exerciseName,
        category: e.category,
        durationSeconds: e.durationSeconds,
        restSeconds: e.restSeconds,
        order: e.order,
      })),
    });
    await completeSession(session._id, day.totalDurationSeconds);
    setMsg('Đã hoàn thành buổi tập.');
    void stats.reload();
    void streak.reload();
    void program.reload();
  }

  return (
    <div className="screen workouts-screen">
      <div className="sub-gradient-header">
        <h1><Dumbbell size={24} /> Luyện tập</h1>
        <p>Kiên trì mỗi ngày, kết quả đến tự nhiên</p>
      </div>
      <div className="metric-grid">
        <Metric label="Streak tập" value={streak.data?.currentStreak ?? 0} unit="ngày" />
        <Metric label="Tuần này" value={stats.data?.minutes ?? 0} unit="phút" />
        <Metric label="Bài tập" value={stats.data?.exercises ?? 0} unit="lượt" />
        <Metric label="Calo đốt" value={stats.data?.kcal ?? 0} unit="kcal" />
      </div>
      {msg && <p className="success">{msg}</p>}
      <section className="card">
        <div className="section-head">
          <div><h2>Khám phá chương trình</h2></div>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="beginner">Người mới</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </div>
        <div className="program-grid">
          {(programs.data || []).map((item: ProgramSummary) => (
            <button key={item._id} className={classNames('program-card', programId === item._id && 'active')} onClick={() => setProgramId(item._id)}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} />}
              <span>{item.level}</span>
              <strong>{item.title}</strong>
              <small>{item.totalDays} ngày · ~{item.avgDayMinutes} phút/ngày</small>
              <em>{item.userProgress ? `${item.userProgress.completedDays.length}/${item.totalDays} ngày` : 'Chưa bắt đầu'}</em>
            </button>
          ))}
        </div>
      </section>
      {program.data && (
        <section className="card">
          <div className="section-head">
            <div><h2>{program.data.title}</h2><p>{program.data.description}</p></div>
            <Button onClick={() => start(program.data!._id)}>Bắt đầu</Button>
          </div>
          <div className="day-list">
            {program.data.days.map((day) => (
              <div className="day-card" key={day.dayNumber}>
                <div><strong>Ngày {day.dayNumber}: {day.title}</strong><small>{day.exercises.length} bài · {day.totalDurationMinutes} phút</small></div>
                <ul>{day.exercises.map((e) => <li key={`${day.dayNumber}-${e.order}`}>{e.exerciseName} · {Math.round(e.durationSeconds / 60)} phút</li>)}</ul>
                <Button variant="soft" onClick={() => completeDay(program.data!, day.dayNumber)}>Hoàn thành ngày này</Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Habits() {
  const today = useAsync(getHabitsToday, []);
  const weekly = useAsync(getWeeklyHabits, []);
  const streak = useAsync(getHabitStreak, []);
  const completed = new Set(today.data?.completed || []);

  async function check(id: HabitId) {
    await checkInHabit(id);
    void today.reload();
    void weekly.reload();
    void streak.reload();
  }

  return (
    <div className="screen">
      <div className="sub-gradient-header">
        <h1><CheckCircle2 size={24} /> Thói quen</h1>
        <p>{streak.data?.streakDays || 0} ngày streak · Hoàn thành ít nhất 3 habit mỗi ngày</p>
      </div>
      <section className="card">
        <h2>Hôm nay</h2>
        <div className="habit-grid">
          {(Object.keys(habitLabels) as HabitId[]).map((id) => (
            <button className={classNames('habit-card', completed.has(id) && 'done')} key={id} onClick={() => check(id)}>
              <strong>{id === 'water' ? <Droplet size={19} /> : id === 'exercise' ? <Dumbbell size={19} /> : id === 'nut-milk' ? <Leaf size={19} /> : id === 'sleep' ? <Circle size={19} /> : id === 'vegetables' ? <Apple size={19} /> : <CalendarDays size={19} />} {habitLabels[id]}</strong>
              <span>{completed.has(id) ? 'Đã xong' : 'Check-in'}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>7 ngày gần đây</h2>
        <div className="heat-row">{(weekly.data || []).map((d: { date: string; qualified: boolean }) => <span className={d.qualified ? 'hot' : ''} key={d.date}>{new Date(d.date).getDate()}</span>)}</div>
      </section>
    </div>
  );
}

function Profile({ user, setUser, setPage, onLogout }: { user: AuthUser; setUser: (u: AuthUser) => void; setPage: (p: Page) => void; onLogout: () => void }) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.profile?.age || 22);
  const [height, setHeight] = useState(user.profile?.heightCm || 160);
  const [weight, setWeight] = useState(user.profile?.weightKg || 50);
  const [goalType, setGoalType] = useState<GoalType>(user.profile?.goalType || 'maintain');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [ratingOpen, setRatingOpen] = useState(false);
  const stats = useAsync(getProfileStats, []);
  const entitlement = useAsync(getEntitlement, []);
  const rating = useAsync(getRatingStatus, []);

  useEffect(() => {
    if (entitlement.data?.hasActiveEntitlement && rating.data?.status === 'eligible') setRatingOpen(true);
  }, [entitlement.data?.hasActiveEntitlement, rating.data?.status]);

  async function saveProfile() {
    const profile = await updateProfile({ name, age: Number(age), heightCm: Number(height), weightKg: Number(weight), goalType });
    const next = { ...user, name: profile.name, profile: profile.profile };
    updateStoredUser(next);
    setUser(next);
    setMsg('Đã lưu hồ sơ.');
  }

  async function redeem() {
    const res = await redeemCode(code);
    setMsg(res.message || 'Đã kích hoạt mã.');
    setCode('');
    setRatingOpen(true);
    void entitlement.reload();
  }

  return (
    <div className="screen profile-screen">
      <div className="profile-header">
        <div className="avatarCircle"><User size={36} /></div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <div className="metric-grid compact">
          <Metric label="Ngày streak" value={stats.data?.streakDays || 0} />
          <Metric label="Bài tập" value={stats.data?.totalWorkouts || 0} />
          <Metric label="Calo đốt" value={stats.data?.totalKcalBurned || 0} />
        </div>
      </div>
      <section className="card">
        <h2><User size={20} /> Thông tin cá nhân</h2>
        <div className="info-list">
          <InfoRow icon={<Mail size={18} />} label="Email" value={user.email} />
          <InfoRow icon={<CalendarDays size={18} />} label="Tuổi" value={`${age || '—'} tuổi`} />
          <InfoRow icon={<Ruler size={18} />} label="Chiều cao" value={`${height || '—'} cm`} />
          <InfoRow icon={<Scale size={18} />} label="Cân nặng" value={`${weight || '—'} kg`} />
          <InfoRow icon={<Trophy size={18} />} label="Mục tiêu" value={goalLabel[goalType]} />
        </div>
        <details className="edit-profile-panel">
          <summary>Cập nhật thông tin</summary>
          <div className="grid2">
            <Field label="Tên" value={name} onChange={setName} />
            <Field label="Tuổi" value={age} onChange={(v) => setAge(Number(v))} type="number" />
            <Field label="Chiều cao" value={height} onChange={(v) => setHeight(Number(v))} type="number" />
            <Field label="Cân nặng" value={weight} onChange={(v) => setWeight(Number(v))} type="number" />
            <label className="field"><span>Mục tiêu</span><select value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>{Object.entries(goalLabel).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          </div>
          <Button onClick={saveProfile}>Lưu hồ sơ</Button>
        </details>
        {msg && <p className="success">{msg}</p>}
      </section>
      <section className="card">
        <h2><Sparkles size={20} /> Gói scan AI</h2>
        <div className={classNames('entitlement', entitlement.data?.hasActiveEntitlement && 'active')}>
          <strong>{entitlement.data?.hasActiveEntitlement ? <><Sparkles size={18} /> Đang active</> : <><LockOpen size={18} /> Chưa active</>}</strong>
          <span>{entitlement.data?.hasActiveEntitlement ? `${entitlement.data.quotaPolicy?.dailyLimit || 30} lượt/ngày đến ${new Date(entitlement.data.activeUntil || '').toLocaleDateString('vi-VN')}` : 'Nhập mã trong chai sữa Ủ để mở gói.'}</span>
        </div>
        <Field label="Mã campaign" value={code} onChange={setCode} />
        <Button onClick={redeem} disabled={!code.trim()}>Kích hoạt mã</Button>
        <div className="divider" />
        <Button variant="soft" onClick={() => setRatingOpen(true)}><Star size={18} /> Đánh giá app</Button>
      </section>
      <section className="card achievement-card">
        <h2><Trophy size={20} /> Thành tích</h2>
        <div className="achievement-row">
          {[7, 14, 28, 60].map((day) => (
            <div className={classNames('milestone', (stats.data?.streakDays || 0) >= day && 'done')} key={day}>
              {day >= 60 ? <Trophy size={22} /> : day >= 28 ? <Star size={22} /> : day >= 14 ? <Flame size={22} /> : <TrendingUp size={22} />}
              <span>{day} ngày</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card settings-card">
        <h2><Settings size={20} /> Cài đặt</h2>
        <button onClick={() => setPage('notifications')}><Bell size={20} /> Thông báo <ChevronLeft className="chev" size={18} /></button>
        <button><Shield size={20} /> Quyền riêng tư <ChevronLeft className="chev" size={18} /></button>
        <button onClick={onLogout}><LockOpen size={20} /> Đăng xuất <ChevronLeft className="chev" size={18} /></button>
      </section>
      {ratingOpen && <RatingModal onClose={() => { setRatingOpen(false); void rating.reload(); }} />}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function RatingModal({ onClose }: { onClose: () => void }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');

  async function submit() {
    try {
      await submitRating(stars, comment, 'profile_prompt');
      onClose();
    } catch (error) {
      setErr(errorMessage(error));
    }
  }

  async function later() {
    await dismissRating('profile_prompt');
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Đánh giá trải nghiệm Ủ</h2>
        <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</button>)}</div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Góp ý thêm" />
        {err && <p className="error">{err}</p>}
        <Button onClick={submit}>Gửi đánh giá</Button>
        <Button variant="ghost" onClick={later}>Để sau</Button>
      </div>
    </div>
  );
}

function Notifications() {
  const stats = useAsync(getProfileStats, []);
  const [form, setForm] = useState({
    waterReminder: true,
    workoutReminder: true,
    nutMilkReminder: true,
    waterReminderTimes: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    workoutReminderTime: '07:00',
    nutMilkReminderTime: '20:00',
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (stats.data?.notifications) {
      setForm({
        waterReminder: stats.data.notifications.waterReminder,
        workoutReminder: stats.data.notifications.workoutReminder,
        nutMilkReminder: stats.data.notifications.nutMilkReminder,
        waterReminderTimes: stats.data.notifications.waterReminderTimes,
        workoutReminderTime: stats.data.notifications.workoutReminderTime,
        nutMilkReminderTime: stats.data.notifications.nutMilkReminderTime,
      });
    }
  }, [stats.data?.notifications]);

  async function save() {
    await updateNotifications({ ...form, waterReminderTime: form.waterReminderTimes[0] });
    setMsg('Đã lưu lịch nhắc. Trên web MVP chưa gửi push notification, lịch này sẽ dùng cho app mobile.');
  }

  return (
    <div className="screen">
      <section className="card">
        <h1><Bell size={24} /> Lịch nhắc sức khỏe</h1>
        <Toggle label="Nhắc uống nước" value={form.waterReminder} onChange={(v) => setForm({ ...form, waterReminder: v })} />
        {form.waterReminder && form.waterReminderTimes.map((time, index) => (
          <Field key={index} label={`Uống nước lần ${index + 1}`} value={time} type="time" onChange={(v) => {
            const next = [...form.waterReminderTimes];
            next[index] = v;
            setForm({ ...form, waterReminderTimes: next });
          }} />
        ))}
        <Toggle label="Nhắc tập luyện" value={form.workoutReminder} onChange={(v) => setForm({ ...form, workoutReminder: v })} />
        {form.workoutReminder && <Field label="Giờ tập luyện" value={form.workoutReminderTime} type="time" onChange={(v) => setForm({ ...form, workoutReminderTime: v })} />}
        <Toggle label="Nhắc uống sữa Ủ" value={form.nutMilkReminder} onChange={(v) => setForm({ ...form, nutMilkReminder: v })} />
        {form.nutMilkReminder && <Field label="Giờ uống sữa Ủ" value={form.nutMilkReminderTime} type="time" onChange={(v) => setForm({ ...form, nutMilkReminderTime: v })} />}
        <Button onClick={save}>Lưu thông báo</Button>
        {msg && <p className="success">{msg}</p>}
      </section>
    </div>
  );
}

function App() {
  const initial = getStoredAuth();
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [seenIntro, setSeenIntro] = useState(localStorage.getItem(INTRO_KEY) === '1');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState<Page>('home');

  if (!seenIntro) return <IntroOnboarding onDone={(mode) => { setAuthMode(mode); setSeenIntro(true); }} />;
  if (!user) return <AuthScreen onAuth={setUser} initialMode={authMode} />;
  if (!user.profileCompleted) return <Onboarding user={user} onDone={setUser} />;

  function logout() {
    clearAuth();
    setUser(null);
  }

  return (
    <Shell page={page} setPage={setPage} user={user} onLogout={logout}>
      {page === 'home' && <Home setPage={setPage} />}
      {page === 'scan' && <ScanScreen />}
      {page === 'food' && <FoodDiary setPage={setPage} />}
      {page === 'bmi' && <BmiMilk user={user} setUser={setUser} />}
      {page === 'workouts' && <Workouts />}
      {page === 'habits' && <Habits />}
      {page === 'profile' && <Profile user={user} setUser={setUser} setPage={setPage} onLogout={logout} />}
      {page === 'notifications' && <Notifications />}
    </Shell>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
