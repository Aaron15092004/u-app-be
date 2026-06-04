import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Apple,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Dumbbell,
  Droplet,
  Flame,
  Flashlight,
  Heart,
  HelpCircle,
  Home as HomeIcon,
  ImageUp,
  Leaf,
  LockOpen,
  Mail,
  Minus,
  Moon,
  PersonStanding,
  Plus,
  QrCode,
  RefreshCw,
  Ribbon,
  Ruler,
  Scale,
  Settings,
  Shield,
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
  MilkPageContent,
  ProgramDetail,
  ProgramSummary,
  ScanResult,
  TodaySummary,
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
  getBmiHistory,
  getFoodLogs,
  getFoodLogsRange,
  getHabitsToday,
  getHabitStreak,
  getMilkRecommendations,
  getMilkPageContent,
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
  uploadFoodLogImage,
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

type Page = 'home' | 'scan' | 'food' | 'bmi' | 'workouts' | 'habits' | 'profile' | 'notifications' | 'help';
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

const VITAMIN_META: Record<string, { label: string; unit: string; icon: string; color: string }> = {
  vitaminC:   { label: 'Vitamin C',   unit: 'mg',  icon: 'sunny',     color: '#FFB300' },
  vitaminA:   { label: 'Vitamin A',   unit: 'mcg', icon: 'eye',       color: '#FF9800' },
  vitaminD:   { label: 'Vitamin D',   unit: 'mcg', icon: 'sun',       color: '#FFC107' },
  vitaminE:   { label: 'Vitamin E',   unit: 'mg',  icon: 'leaf',      color: '#8BC34A' },
  vitaminK:   { label: 'Vitamin K',   unit: 'mcg', icon: 'heart',     color: '#4CAF50' },
  vitaminB1:  { label: 'Vitamin B1',  unit: 'mg',  icon: 'zap',       color: '#03A9F4' },
  vitaminB2:  { label: 'Vitamin B2',  unit: 'mg',  icon: 'zap',       color: '#2196F3' },
  vitaminB3:  { label: 'Vitamin B3',  unit: 'mg',  icon: 'zap',       color: '#9C27B0' },
  vitaminB12: { label: 'Vitamin B12', unit: 'mcg', icon: 'star',      color: '#E91E63' },
  folate:     { label: 'Folate (B9)', unit: 'mcg', icon: 'leaf',      color: '#66BB6A' },
};

const MINERAL_META: Record<string, { label: string; unit: string; icon: string; color: string }> = {
  sodium:     { label: 'Natri',   unit: 'mg',  icon: 'flask',        color: '#78909C' },
  potassium:  { label: 'Kali',    unit: 'mg',  icon: 'zap',          color: '#9C27B0' },
  calcium:    { label: 'Canxi',   unit: 'mg',  icon: 'git-branch',   color: '#607D8B' },
  magnesium:  { label: 'Magie',   unit: 'mg',  icon: 'radio',        color: '#00897B' },
  phosphorus: { label: 'Phospho', unit: 'mg',  icon: 'circle',       color: '#1976D2' },
  iron:       { label: 'Sắt',     unit: 'mg',  icon: 'dumbbell',     color: '#D32F2F' },
  zinc:       { label: 'Kẽm',     unit: 'mg',  icon: 'shield',       color: '#455A64' },
  selenium:   { label: 'Selen',   unit: 'mcg', icon: 'shield',       color: '#FFA726' },
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
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = !!preview;
  const showCamera = !result;

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError(true);
      }
    }
    start();
    return () => { cancelled = true; stopStream(); };
  }, []);

  function toggleFlash() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities() as Record<string, unknown>;
    if (!capabilities.torch) return;
    setFlash((prev) => {
      const next = !prev;
      track.applyConstraints({ advanced: [{ torch: next }] as unknown as MediaTrackConstraintSet[] }).catch(() => {});
      return next;
    });
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], 'meal.jpg', { type: 'image/jpeg' });
      setFile(f);
      setPreview(URL.createObjectURL(f));
      stopStream();
    }, 'image/jpeg', 0.85);
  }

  function pick(next: File | null) {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : '');
  }

  function retake() {
    setPreview('');
    setFile(null);
    setResult(null);
    setMessage('');
    if (!cameraError) {
      async function restart() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
          setCameraError(true);
        }
      }
      restart();
    }
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
      const saved = await saveFoodLog(result);
      if (file) {
        void uploadFoodLogImage(saved._id, file).catch(() => null);
      }
      setMessage('Đã lưu bữa ăn.');
      setResult(null);
      retake();
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
      {showCamera && (
      <div className="scan-view">
        {cameraError ? (
          <div className="scan-fallback-bg" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="scan-video-bg" />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="scan-overlay-header">
          <button type="button" className="scan-back-btn"><ChevronLeft size={24} /></button>
          <div>
            <h1>Quét bữa ăn</h1>
            <p>{cameraError ? 'Chọn ảnh từ thư viện' : 'Chụp ảnh để phân tích dinh dưỡng'}</p>
          </div>
        </div>

        {cameraError && !hasImage && (
          <div className="scan-fallback-card">
            <Camera size={56} />
            <h2>Không thể truy cập camera</h2>
            <p>Vui lòng chọn ảnh từ thư viện để phân tích</p>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] || null)} />
            <button className="scan-fallback-btn" onClick={() => fileInputRef.current?.click()}>
              <ImageUp size={20} /> Chọn từ thư viện
            </button>
          </div>
        )}

        {!cameraError && !hasImage && (
          <div className="scan-frame-overlay">
            <div className="scan-frame-brackets">
              <div className="bracket tl" />
              <div className="bracket tr" />
              <div className="bracket bl" />
              <div className="bracket br" />
            </div>
            <div className="scan-frame-center">
              <Camera size={36} />
              <span>Căn chỉnh bữa ăn vào khung</span>
            </div>
            {busy && (
              <div className="scan-scanning-badge">
                <RefreshCw size={16} /> Đang phân tích...
              </div>
            )}
          </div>
        )}

        {hasImage && (
          <div className="scan-preview-wrap">
            <img className="scan-preview-img" src={preview} alt="" />
            <div className="scan-preview-actions">
              <button className="scan-action-btn soft" onClick={retake} disabled={busy}>
                <RefreshCw size={18} /> Chụp lại
              </button>
              <button className="scan-action-btn primary" onClick={runScan} disabled={busy}>
                {busy ? <><RefreshCw size={18} /> Đang phân tích...</> : <><Sparkles size={18} /> Phân tích ảnh</>}
              </button>
            </div>
          </div>
        )}

        <div className="scan-bottom">
          <div className="scan-barcode-card">
            <div className="scan-barcode-header">
              <span className="scan-barcode-title">Tra cứu bằng mã vạch</span>
            </div>
            <div className="scan-barcode-row">
              <input
                className="scan-barcode-input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Nhập barcode"
              />
              <button className="scan-barcode-btn" onClick={barcodeLookup} disabled={busy}>
                {busy ? 'Đang tìm' : 'Xem'}
              </button>
            </div>
          </div>

          <p className="scan-hint">Nhấn nút chụp hoặc chọn từ thư viện</p>

          {!cameraError && !hasImage && (
            <div className="scan-controls">
              <button className="scan-control-btn" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                <ImageUp size={22} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] || null)} />
              <div className="scan-capture-outer">
                <button className="scan-capture-inner" onClick={capture} disabled={busy}>
                  {busy ? <RefreshCw size={28} /> : <Camera size={28} />}
                </button>
              </div>
              <button className="scan-control-btn" onClick={toggleFlash} disabled={busy}>
                <Flashlight size={22} />
              </button>
            </div>
          )}

          {message && <p className={message.includes('Đã') ? 'scan-msg success' : 'scan-msg error'}>{message}</p>}
        </div>
      </div>)}
      {result && (
        <FoodResult result={result} preview={preview} file={file} onSave={save} onRetake={retake} busy={busy} />
      )}
    </div>
  );
}

function NutrRow({ icon, iconColor, label, value, unit, hero, last }: {
  icon?: string; iconColor: string; label: string; value: number; unit: string; hero?: boolean; last?: boolean;
}) {
  const formatted = value % 1 === 0 ? String(value) : value.toFixed(1);
  return (
    <div className={`nr ${last ? 'nr-last' : ''}`}>
      <div className="nr-left">
      {icon && <div className="nr-icon" style={{ backgroundColor: iconColor + '18' }}>
          <span style={{ color: iconColor }}>✦</span>
        </div>}
        <span className={`nr-label ${hero ? 'nr-hero-label' : ''}`}>{label}</span>
      </div>
      <div className="nr-right">
        <span className={`nr-value ${hero ? 'nr-hero-value' : ''}`}>{formatted}</span>
        <span className={`nr-unit ${hero ? 'nr-hero-unit' : ''}`}>{unit}</span>
      </div>
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <p className="section-label">{title}</p>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="nr-card">{children}</div>;
}

function FoodResult({ result, preview, file, onSave, onRetake, busy }: {
  result: ScanResult; preview: string; file: File | null; onSave: () => void; onRetake: () => void; busy: boolean;
}) {
  const { foods, totals } = result;

  const fiber = foods.reduce((s, f) => s + (f.fiber ?? 0), 0);
  const sugar = foods.reduce((s, f) => s + (f.sugar ?? 0), 0);

  const allVitamins: Record<string, number> = {};
  const allMinerals: Record<string, number> = {};
  for (const f of foods) {
    for (const [k, v] of Object.entries(f.vitamins ?? {})) {
      allVitamins[k] = (allVitamins[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(f.minerals ?? {})) {
      allMinerals[k] = (allMinerals[k] ?? 0) + v;
    }
  }
  const vitaminEntries = Object.entries(allVitamins).filter(([, v]) => v > 0);
  const mineralEntries = Object.entries(allMinerals).filter(([, v]) => v > 0);

  return (
    <div className="result-wrap">
      <div className="result-header" style={{
        background: 'linear-gradient(135deg, #6C9A24, #B7CD65)',
      }}>
        <button className="result-back" onClick={onRetake}><ChevronLeft size={24} /></button>
        <div className="result-header-center">
          <h2>Kết quả phân tích</h2>
          <p>{foods.length > 1 ? `${foods.length} món ăn` : (foods[0]?.name ?? 'Bữa ăn')}</p>
        </div>
        <div className="result-cal-badge">
          <span className="result-cal-num">{Math.round(totals.calories)}</span>
          <span className="result-cal-unit">kcal</span>
        </div>
      </div>

      <div className="result-body">
        {preview && (
          <div className="result-photo-card">
            <img className="result-photo" src={preview} alt="" />
          </div>
        )}

        {result.commentVi && (
          <>
            <SectionLabel title="Nhận xét nhanh" />
            <div className="result-comment-card">
              <p>{result.commentVi}</p>
            </div>
          </>
        )}

        <SectionLabel title="Dinh dưỡng chính" />
        <Card>
          <NutrRow iconColor="#FF5722" label="Năng lượng" value={totals.calories} unit="kcal" hero />
          <NutrRow iconColor="#4CAF50" label="Chất đạm"   value={totals.protein}  unit="g" />
          <NutrRow iconColor="#FF9800" label="Tinh bột"   value={totals.carbs}    unit="g" />
          <NutrRow iconColor="#FFC107" label="Chất béo"   value={totals.fat}      unit="g" />
          <NutrRow iconColor="#8BC34A" label="Chất xơ"    value={fiber}           unit="g" last={sugar <= 0} />
          {sugar > 0 && (
            <NutrRow iconColor="#EC407A" label="Đường"      value={sugar}           unit="g" last />
          )}
        </Card>

        {vitaminEntries.length > 0 && (
          <>
            <SectionLabel title="Vitamin" />
            <Card>
              {vitaminEntries.map(([key, value], i) => {
                const meta = VITAMIN_META[key] ?? { label: key, unit: 'mg', icon: 'star', color: '#9E9E9E' };
                return <NutrRow key={key} iconColor={meta.color} label={meta.label} value={value} unit={meta.unit} last={i === vitaminEntries.length - 1} />;
              })}
            </Card>
          </>
        )}

        {mineralEntries.length > 0 && (
          <>
            <SectionLabel title="Khoáng chất" />
            <Card>
              {mineralEntries.map(([key, value], i) => {
                const meta = MINERAL_META[key] ?? { label: key, unit: 'mg', icon: 'flask', color: '#9E9E9E' };
                return <NutrRow key={key} iconColor={meta.color} label={meta.label} value={value} unit={meta.unit} last={i === mineralEntries.length - 1} />;
              })}
            </Card>
          </>
        )}

        <SectionLabel title="Chi tiết từng món" />
        <Card>
          {foods.map((f, i) => (
            <div className={`nr ${i === foods.length - 1 ? 'nr-last' : ''}`} key={i}>
              <div className="food-detail-left">
                <span className="food-detail-name">{f.name}</span>
                {f.weightG ? <span className="food-detail-weight">{f.weightG}g</span> : null}
              </div>
              <span className="food-detail-cal">{Math.round(f.calories)} kcal</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="result-bottom-bar">
        <button className="result-save-btn" onClick={onSave} disabled={busy}>
          {busy ? 'Đang lưu...' : 'Lưu bữa ăn'}
        </button>
        <button className="result-retry-btn" onClick={onRetake} disabled={busy}>
          Chụp lại
        </button>
      </div>
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

function BmiScaleBar({ bmi }: { bmi: number }) {
  const percent = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
  return (
    <div className="bm-scale">
      <div className="bm-scale-bar">
        <div className="bm-segment" style={{ backgroundColor: '#FFC107' }} />
        <div className="bm-segment" style={{ backgroundColor: '#4CAF50' }} />
        <div className="bm-segment" style={{ backgroundColor: '#FF9800' }} />
        <div className="bm-segment" style={{ backgroundColor: '#EF5350' }} />
      </div>
      <div className="bm-dot" style={{ left: `calc(${percent}% - 8px)` }} />
    </div>
  );
}

function BmiMilk({ user, setUser }: { user: AuthUser; setUser: (u: AuthUser) => void }) {
  const [height, setHeight] = useState(user.profile?.heightCm || 160);
  const [weight, setWeight] = useState(user.profile?.weightKg || 50);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState(false);
  const [err, setErr] = useState('');
  const bmi = Number((Number(weight) / (Number(height) / 100) ** 2).toFixed(1));
  const category = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';
  const categoryVi = { underweight: 'Thiếu cân', normal: 'Bình thường', overweight: 'Thừa cân', obese: 'Béo phì' }[category];
  const advice = {
    underweight: 'Hãy tăng cường dinh dưỡng và tập thể dục để đạt cân nặng khỏe mạnh.',
    normal: 'Duy trì thói quen tốt và tiếp tục phát huy!',
    overweight: 'Tăng cường vận động và điều chỉnh chế độ ăn uống để cải thiện sức khỏe.',
    obese: 'Nên tham khảo ý kiến bác sĩ để có kế hoạch giảm cân an toàn.',
  }[category];

  const milkData = useAsync(() => getMilkRecommendations({ bmi }), [bmi]);
  const recommended = milkData.data?.flavors.find((f: any) => f.bmiRule === milkData.data?.bmiRule) || milkData.data?.flavors?.[0];
  const historyData = useAsync(getBmiHistory, [toast]);

  async function saveStats() {
    setErr('');
    try {
      await saveBmi(Number(height), Number(weight));
      const profile = await updateProfile({ heightCm: Number(height), weightKg: Number(weight) });
      const next = { ...user, name: profile.name, profile: profile.profile };
      updateStoredUser(next);
      setUser(next);
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    } catch {
      setErr('Không thể lưu chỉ số BMI. Kiểm tra kết nối và thử lại.');
    }
  }

  async function saveMilk() {
    if (!recommended) return;
    await selectMilk({
      selectedFlavorId: recommended.flavorId,
      recommendedFlavorId: recommended.flavorId,
      bmi,
      source: 'bmi_recommendation',
    });
    setMsg('Đã lưu');
    setTimeout(() => setMsg(''), 2000);
    void milkData.reload();
  }

  const records = (historyData.data ?? []) as Array<{ bmi: number }>;
  const maxBmi = Math.max(...records.map((r) => r.bmi), 30);
  const last5 = records.slice(-5);

  return (
    <div className="screen bm-screen">
      <div className="bm-header">
        <h1>Phân tích BMI</h1>
        <p>Theo dõi chỉ số cơ thể của bạn</p>
      </div>
      <div className="bm-body">
        {/* BMI result card */}
        <div className="bm-result-card">
          <div className="bm-top-row">
            <span className="bm-score">{bmi}</span>
            <span className="bm-category">{categoryVi}</span>
          </div>
          <BmiScaleBar bmi={bmi} />
          <div className="bm-range-labels">
            <span>15</span>
            <span>40</span>
          </div>
        </div>

        {/* Sliders card */}
        <div className="bm-card">
          <span className="bm-section-title">Cập nhật số đo</span>
          <div className="bm-slider-row">
            <span>Chiều cao</span>
            <span className="bm-slider-val">{height} cm</span>
          </div>
          <input type="range" min={100} max={220} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="bm-range" />
          <div className="bm-slider-row" style={{ marginTop: 16 }}>
            <span>Cân nặng</span>
            <span className="bm-slider-val">{weight} kg</span>
          </div>
          <input type="range" min={30} max={200} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="bm-range" />
        </div>

        {/* Save button */}
        <div className="bm-btn-wrap">
          <button className="bm-btn" onClick={saveStats}>Lưu số đo</button>
          {err && <p className="scan-msg error" style={{ margin: '8px 0 0', fontSize: 13, textAlign: 'center' }}>{err}</p>}
        </div>

        {/* Advice */}
        <div className="bm-card">
          <span className="bm-section-title">Lời khuyên</span>
          <p className="bm-advice">{advice}</p>
        </div>

        {/* Milk card */}
        {recommended && (
          <div className="bm-milk-card">
            <div className="bm-milk-head">
              <div className="bm-milk-icon">
                <Leaf size={20} />
              </div>
              <div>
                <span className="bm-milk-title">Sữa Ủ phù hợp</span>
                <span className="bm-milk-sub">Gợi ý theo BMI hiện tại của bạn</span>
              </div>
            </div>
            <span className="bm-milk-name">{recommended.nameVi}</span>
            <p className="bm-milk-copy">{recommended.positioningVi}</p>
            <p className="bm-milk-disclaimer">{milkData.data?.disclaimer ?? 'Gợi ý sản phẩm theo sở thích và thể trạng, không phải tư vấn y khoa.'}</p>
            <button className="bm-milk-save" onClick={saveMilk}>{msg || 'Lưu lựa chọn này'}</button>
          </div>
        )}

        {/* Chart */}
        <div className="bm-chart-section">
          <span className="bm-section-title">Lịch sử 30 ngày</span>
          <div className="bm-chart-card">
            {last5.length === 0 ? (
              <p className="bm-chart-empty">Chưa có dữ liệu BMI. Nhập số đo và nhấn Lưu số đo để bắt đầu theo dõi.</p>
            ) : (
              <div className="bm-chart">
                {last5.map((r, idx) => (
                  <div className="bm-chart-row" key={idx}>
                    <span className="bm-chart-label">{r.bmi.toFixed(1)}</span>
                    <div className="bm-chart-bar" style={{ width: `${(r.bmi / maxBmi) * 100}%` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="bm-toast">Đã lưu!</div>}
    </div>
  );
}

const LEVEL_CHIPS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'beginner', label: 'Người mới' },
  { id: 'intermediate', label: 'Trung cấp' },
  { id: 'advanced', label: 'Nâng cao' },
];

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Người mới', color: '#4CAF50' },
  intermediate: { label: 'Trung cấp', color: '#FFA726' },
  advanced: { label: 'Nâng cao', color: '#EF5350' },
};

function ProgramCard({ program, onPress }: { program: ProgramSummary; onPress: () => void }) {
  const cfg = LEVEL_CONFIG[program.level] ?? LEVEL_CONFIG.beginner;
  const progress = program.userProgress;
  const hasImage = !!program.imageUrl;
  const LevelIcon = program.level === 'advanced' ? Trophy : program.level === 'intermediate' ? Flame : Leaf;

  return (
    <button className="w-card" onClick={onPress}>
      <div className="w-card-bg" style={hasImage ? { backgroundImage: `url(${program.imageUrl})` } : { background: 'linear-gradient(180deg, #3E6B10CC, #6C9A24EE)' }}>
        <div className="w-card-gradient" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.68) 0%, transparent 50%)' }}>
          <div className="w-card-badge" style={{ backgroundColor: cfg.color + '33', border: '1px solid rgba(255,255,255,0.2)' }}>
            <LevelIcon size={14} />
            <span>{cfg.label}</span>
          </div>
          <div className="w-card-bottom">
            <strong className="w-card-title">{program.title}</strong>
            {program.description ? <span className="w-card-desc">{program.description}</span> : null}
            <div className="w-card-stats">
              <span className="w-card-stat"><CalendarDays size={13} /> {program.totalDays} ngày</span>
              <span className="w-card-stat"><Clock size={13} /> ~{program.avgDayMinutes} phút/ngày</span>
            </div>
            {progress && program.totalDays > 0 && (
              <div className="w-card-progress">
                <div className="w-card-progress-track">
                  <div className="w-card-progress-fill" style={{ width: `${Math.round((progress.completedDays.length / program.totalDays) * 100)}%` }} />
                </div>
                <span className="w-card-progress-text">{progress.completedDays.length}/{program.totalDays}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function Workouts() {
  const [level, setLevel] = useState('all');
  const [programId, setProgramId] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [programsData, setProgramsData] = useState<ProgramSummary[]>([]);
  const [streakData, setStreakData] = useState<{ currentStreak: number } | null>(null);
  const [programDetail, setProgramDetail] = useState<ProgramDetail | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [progs, str] = await Promise.all([listPrograms(level), getWorkoutStreak()]);
        setProgramsData(progs as ProgramSummary[]);
        setStreakData(str as { currentStreak: number });
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [level]);

  async function loadProgramDetail(id: string) {
    setProgramId(id);
    if (id) {
      const detail = await getProgram(id);
      setProgramDetail(detail as ProgramDetail);
    } else {
      setProgramDetail(null);
    }
  }

  async function start(id: string) {
    await startProgram(id);
    setMsg('Đã bắt đầu chương trình.');
    const [progs] = await Promise.all([listPrograms(level)]);
    setProgramsData(progs as ProgramSummary[]);
    if (programId === id) {
      const detail = await getProgram(id);
      setProgramDetail(detail as ProgramDetail);
    }
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
    const detailReload = await getProgram(detail._id);
    setProgramDetail(detailReload as ProgramDetail);
    const [progs, str] = await Promise.all([listPrograms(level), getWorkoutStreak()]);
    setProgramsData(progs as ProgramSummary[]);
    setStreakData(str as { currentStreak: number });
  }

  const streak = streakData?.currentStreak ?? 0;
  const enrolledPrograms = programsData.filter((p) => p.userProgress?.status === 'active');
  const discoverPrograms = programsData.filter((p) => p.userProgress?.status !== 'active');

  return (
    <div className="screen w-screen">
      <div className="w-header">
        <div className="w-header-top">
          <div>
            <h1>Luyện tập</h1>
            <p>Kiên trì mỗi ngày, kết quả đến tự nhiên</p>
          </div>
          {streak > 0 && (
            <div className="w-streak-badge">
              <Flame size={20} />
              <span className="w-streak-num">{streak}</span>
              <span className="w-streak-lbl">ngày</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-body">
        {msg && <p className="success" style={{ margin: '0 16px' }}>{msg}</p>}

        {enrolledPrograms.length > 0 && (
          <>
            <span className="w-section-title">Chương trình của tôi</span>
            {enrolledPrograms.map((prog) => (
              <ProgramCard key={prog._id} program={prog} onPress={() => loadProgramDetail(prog._id)} />
            ))}
          </>
        )}

        <span className="w-section-title">Khám phá chương trình</span>

        <div className="w-chips">
          {LEVEL_CHIPS.map((chip) => (
            <button key={chip.id} className={`w-chip ${level === chip.id ? 'w-chip-active' : ''}`} onClick={() => { setLevel(chip.id); setProgramId(''); setProgramDetail(null); }}>
              {chip.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <>{[1, 2, 3].map((k) => <div key={k} className="w-skeleton" />)}</>
        ) : discoverPrograms.length === 0 && enrolledPrograms.length === 0 ? (
          <div className="w-empty"><span>Chưa có chương trình nào.</span></div>
        ) : (
          discoverPrograms.map((prog) => (
            <ProgramCard key={prog._id} program={prog} onPress={() => loadProgramDetail(prog._id)} />
          ))
        )}

        {/* Program detail modal */}
        {programDetail && (
          <div className="w-modal-backdrop" onClick={() => { setProgramId(''); setProgramDetail(null); }}>
            <div className="w-modal" onClick={(e) => e.stopPropagation()}>
              <div className="w-modal-header">
                <h2>{programDetail.title}</h2>
                {programDetail.description && <p>{programDetail.description}</p>}
                <button className="w-start-btn" onClick={() => start(programDetail._id)}>Bắt đầu</button>
              </div>
              <div className="w-day-list">
                {programDetail.days.map((day) => (
                  <div className="w-day-card" key={day.dayNumber}>
                    <div className="w-day-title">
                      <strong>Ngày {day.dayNumber}: {day.title}</strong>
                      <small>{day.exercises.length} bài · {day.totalDurationMinutes} phút</small>
                    </div>
                    <div className="w-ex-list">
                      {day.exercises.map((e) => (
                        <div className="w-ex-row" key={`${day.dayNumber}-${e.order}`}>
                          <span>{e.exerciseName}</span>
                          <span>{Math.round(e.durationSeconds / 60)} phút</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-complete-btn" onClick={() => completeDay(programDetail, day.dayNumber)}>
                      Hoàn thành ngày này
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-close-btn" onClick={() => { setProgramId(''); setProgramDetail(null); }}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const HABIT_DEFS: Array<{
  id: HabitId; name: string; iconColor: string; iconBg: string; barColor: string; mode: 'water-log' | 'auto' | 'manual';
}> = [
  { id: 'water',      name: 'Uống 8 ly nước',      iconColor: '#2196F3', iconBg: '#E3F2FD', barColor: '#2196F3', mode: 'water-log' },
  { id: 'vegetables', name: 'Ăn đủ chất',           iconColor: '#4CAF50', iconBg: '#E8F5E9', barColor: '#4CAF50', mode: 'auto' },
  { id: 'exercise',   name: 'Tập luyện hôm nay',    iconColor: '#FF6B35', iconBg: '#FFF3EE', barColor: '#FF6B35', mode: 'auto' },
  { id: 'sleep',      name: 'Ngủ đủ 8 tiếng',       iconColor: '#7C3AED', iconBg: '#F5F3FF', barColor: '#7C3AED', mode: 'manual' },
  { id: 'nut-milk',   name: 'Uống sữa hạt từ Ủ',    iconColor: '#F59E0B', iconBg: '#FFFBEB', barColor: '#F59E0B', mode: 'manual' },
];

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toYMD(d);
  });
}

const HABIT_ICONS: Record<string, React.ElementType> = {
  water: Droplet,
  vegetables: Leaf,
  exercise: Dumbbell,
  sleep: Moon,
  'nut-milk': Droplet,
};

function HabitCard({ habit, isCompleted, progress, onAction, isLoading }: {
  habit: typeof HABIT_DEFS[0]; isCompleted: boolean;
  progress: { current: number; total: number; unit: string; percent: number };
  onAction: (() => void) | null; isLoading: boolean;
}) {
  const pct = progress.percent;
  const HabitIcon = HABIT_ICONS[habit.id] ?? Droplet;
  const showCompleted = isCompleted || (habit.mode === 'auto' && pct >= 1);
  const actionLabel = habit.mode === 'water-log' ? 'Đánh dấu +1' : habit.mode === 'manual' ? 'Xác nhận' : null;

  return (
    <div className="h-card">
      <div className="h-card-header">
        <div className="h-icon-box" style={{ backgroundColor: habit.iconBg }}>
          <HabitIcon size={20} />
        </div>
        <div className="h-name-col">
          <span className="h-name">{habit.name}</span>
          <span className="h-progress">{progress.current}/{progress.total} {progress.unit}</span>
        </div>
        {showCompleted && (
          <div className="h-check-circle" style={{ backgroundColor: habit.iconColor }}>✓</div>
        )}
      </div>
      <div className="h-bar-track">
        <div className="h-bar-fill" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: habit.barColor }} />
      </div>
      {habit.mode === 'auto' && !showCompleted && (
        <span className="h-auto-hint">Tự động cập nhật từ hoạt động của bạn</span>
      )}
      {showCompleted ? (
        <div className="h-done-btn">✓ Hoàn thành</div>
      ) : actionLabel ? (
        <button className="h-action-btn" onClick={isLoading ? undefined : (onAction ?? undefined)} disabled={isLoading}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ProgressCard({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const encouragement = pct === 100 ? 'Tuyệt vời! Hoàn thành rồi!' : pct >= 50 ? 'Tiếp tục phát huy!' : 'Bắt đầu thôi nào!';
  return (
    <div className="h-progress-card">
      <span className="h-progress-title">Tiến độ hôm nay</span>
      <span className="h-progress-sub">{completed}/{total} thói quen hoàn thành</span>
      <div className="h-progress-bar-track">
        <div className="h-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="h-progress-footer">
        <span>{encouragement}</span>
        <span className="h-progress-pct">{pct}%</span>
      </div>
    </div>
  );
}

function StreakCard({ streakDays, weekDates, weeklyMap }: {
  streakDays: number; weekDates: string[]; weeklyMap: Record<string, boolean>;
}) {
  const todayStr = toYMD(new Date());
  return (
    <div className="h-streak-card">
      <div className="h-streak-top">
        <div>
          <span className="h-streak-title">Chuỗi ngày liên tiếp</span>
          <span className="h-streak-sub">{streakDays > 0 ? 'Bạn đang làm rất tốt!' : 'Bắt đầu hôm nay nhé!'}</span>
        </div>
        <div className="h-streak-count">
          <span className="h-streak-num">{streakDays}</span>
          <span className="h-streak-lbl">ngày</span>
        </div>
      </div>
      <div className="h-streak-row">
        {weekDates.map((date, i) => {
          const qualified = weeklyMap[date] ?? false;
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          const circleColor = isFuture ? '#E0E0E0' : isToday ? '#FF6B35' : qualified ? '#B7CD65' : '#E0E0E0';
          return (
            <div className="h-streak-col" key={date}>
              <div className="h-streak-circle" style={{ backgroundColor: circleColor }}>
                {!isFuture && (qualified || isToday) ? '✓' : null}
              </div>
              <span style={{ fontSize: 11, color: isFuture ? '#E0E0E0' : '#999', marginTop: 4 }}>{DAY_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TipsCard() {
  return (
    <div className="h-tips-card">
      <span className="h-tips-title">Mẹo xây dựng thói quen</span>
      {['Bắt đầu với thói quen nhỏ, dễ thực hiện', 'Duy trì ít nhất 21 ngày liên tiếp', 'Đặt lời nhắc để không quên', 'Kết nối thói quen mới với thói quen cũ'].map((tip) => (
        <span key={tip} className="h-tip">• {tip}</span>
      ))}
    </div>
  );
}

function Habits() {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [todayData, setTodayData] = useState<{ completed: HabitId[] } | null>(null);
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; qualified: boolean }>>([]);
  const [streakData, setStreakData] = useState<{ streakDays: number } | null>(null);
  const [statsData, setStatsData] = useState<{ dailyTargets?: { kcal: number } } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<HabitId | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [td, wd, sd, sm, st] = await Promise.all([
          getHabitsToday(),
          getWeeklyHabits(),
          getHabitStreak(),
          getTodaySummary(),
          getProfileStats(),
        ]);
        setTodayData(td);
        setWeeklyData(wd as Array<{ date: string; qualified: boolean }>);
        setStreakData(sd as { streakDays: number });
        setSummary(sm as TodaySummary);
        setStatsData(st as { dailyTargets?: { kcal: number } });
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function reload() {
    try {
      const [td, wd, sd, sm] = await Promise.all([
        getHabitsToday(),
        getWeeklyHabits(),
        getHabitStreak(),
        getTodaySummary(),
      ]);
      setTodayData(td);
      setWeeklyData(wd as Array<{ date: string; qualified: boolean }>);
      setStreakData(sd as { streakDays: number });
      setSummary(sm as TodaySummary);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!summary || !todayData) return;
    async function autoSync() {
      const targetKcal = statsData?.dailyTargets?.kcal ?? 2000;
      const completedSet = new Set(todayData!.completed ?? []);
      for (const id of ['water', 'vegetables', 'exercise'] as HabitId[]) {
        const autoMet = id === 'water' ? summary!.waterGlasses >= summary!.waterGoal
          : id === 'vegetables' ? (summary!.kcalConsumed >= targetKcal * 0.85 && summary!.macros.protein > 0 && summary!.macros.carbs > 0 && summary!.macros.fat > 0)
          : id === 'exercise' ? summary!.workoutMinutes >= 30 : false;
        if (autoMet && !completedSet.has(id)) {
          await checkInHabit(id);
        }
      }
      void reload();
    }
    autoSync();
  }, [summary?.waterGlasses, summary?.kcalConsumed, summary?.workoutMinutes]);

  const completedSet = new Set(todayData?.completed ?? []);
  const targetKcal = statsData?.dailyTargets?.kcal ?? 2000;
  const weekDates = getWeekDates();
  const weeklyMap: Record<string, boolean> = {};
  for (const entry of weeklyData) weeklyMap[entry.date] = entry.qualified;
  const TOTAL = HABIT_DEFS.length;

  function getProgress(id: HabitId, isCompleted: boolean) {
    switch (id) {
      case 'water': {
        const c = summary?.waterGlasses ?? 0;
        const t = summary?.waterGoal ?? 8;
        return { current: c, total: t, unit: 'cốc', percent: Math.min(1, t > 0 ? c / t : 0) };
      }
      case 'vegetables': {
        const c = Math.round(summary?.kcalConsumed ?? 0);
        const t = targetKcal;
        return { current: c, total: t, unit: 'kcal', percent: Math.min(1, t > 0 ? c / t : 0) };
      }
      case 'exercise': {
        const c = summary?.workoutMinutes ?? 0;
        return { current: c, total: 30, unit: 'phút', percent: Math.min(1, c / 30) };
      }
      default: {
        const done = isCompleted ? 1 : 0;
        return { current: done, total: 1, unit: id === 'nut-milk' ? 'cốc' : 'lần', percent: done };
      }
    }
  }

  async function handleCheckIn(id: HabitId) {
    if (busyId) return;
    setBusyId(id);
    try {
      if (id === 'water') {
        await logWater();
      } else {
        await checkInHabit(id);
      }
      void reload();
    } finally {
      setBusyId(null);
    }
  }

  const completedCount = ['water', 'vegetables', 'exercise', 'sleep', 'nut-milk'].filter((id) => completedSet.has(id as HabitId)).length;

  if (isLoading) {
    return (
      <div className="screen h-screen">
        <div className="h-header"><h1>Thói quen</h1><p>Theo dõi thói quen lành mạnh hàng ngày</p></div>
        <div className="h-body">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-skeleton" />)}</div>
      </div>
    );
  }

  return (
    <div className="screen h-screen">
      <div className="h-header">
        <h1>Thói quen</h1>
        <p>Theo dõi thói quen lành mạnh hàng ngày</p>
      </div>
      <div className="h-body">
        <ProgressCard completed={completedCount} total={TOTAL} />
        <StreakCard streakDays={streakData?.streakDays ?? 0} weekDates={weekDates} weeklyMap={weeklyMap} />
        <span className="h-list-title">Danh sách thói quen</span>
        {HABIT_DEFS.map((habit) => {
          const isCompleted = completedSet.has(habit.id);
          const prog = getProgress(habit.id, isCompleted);
          let onAction: (() => void) | null = null;
          if ((habit.mode === 'water-log' || habit.mode === 'manual') && !isCompleted) {
            onAction = () => handleCheckIn(habit.id);
          }
          return <HabitCard key={habit.id} habit={habit} isCompleted={isCompleted} progress={prog} onAction={onAction} isLoading={busyId === habit.id} />;
        })}
        <TipsCard />
      </div>
    </div>
  );
}

const MILESTONES = [
  { days: 7, icon: TrendingUp },
  { days: 14, icon: Ribbon },
  { days: 28, icon: Star },
  { days: 60, icon: Trophy },
];

const GOAL_LABEL: Record<string, string> = {
  lose: 'Giảm cân',
  maintain: 'Giữ cân nặng',
  gain: 'Tăng cân',
};

function MilestoneBadge({ days, Icon, state }: { days: number; Icon: React.ElementType; state: 'active' | 'done' | 'locked' }) {
  return (
    <div className="p-milestone">
      <div className={`p-milestone-circle ${state === 'active' ? 'p-milestone-active' : state === 'done' ? 'p-milestone-done' : 'p-milestone-locked'}`}>
        <Icon size={22} />
      </div>
      <span className="p-milestone-lbl">{days} ngày</span>
    </div>
  );
}

function InfoRow({ icon, label, value, action, onAction, last }: { icon: React.ReactNode; label: string; value: string; action?: string; onAction?: () => void; last?: boolean }) {
  return (
    <div className={`p-info-row ${last ? 'p-info-last' : ''}`}>
      <span className="p-info-icon">{icon}</span>
      <div className="p-info-mid">
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      {action && <button className="p-info-action" onClick={onAction}>{action}</button>}
    </div>
  );
}

function SettingsRow({ icon, label, onPress, danger, last }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <button className={`p-sett-row ${last ? 'p-sett-last' : ''}`} onClick={onPress}>
      <span className="p-sett-icon" style={danger ? { color: '#EF5350' } : undefined}>{icon}</span>
      <span className="p-sett-label" style={danger ? { color: '#EF5350' } : undefined}>{label}</span>
      <ChevronRight size={16} className="p-sett-chev" />
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <span className="p-section-title">{title}</span>;
}

function Profile({ user, setUser, setPage, onLogout }: { user: AuthUser; setUser: (u: AuthUser) => void; setPage: (p: Page) => void; onLogout: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAge, setEditAge] = useState(user.profile?.age || 22);
  const [editHeight, setEditHeight] = useState(user.profile?.heightCm || 160);
  const [editWeight, setEditWeight] = useState(user.profile?.weightKg || 50);
  const [editGoal, setEditGoal] = useState<GoalType>(user.profile?.goalType || 'maintain');
  const [editWater, setEditWater] = useState(user.profile?.waterGoal || 8);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [ratingOpen, setRatingOpen] = useState(false);
  const [milkSelected, setMilkSelected] = useState('');
  const stats = useAsync(getProfileStats, []);
  const entitlement = useAsync(getEntitlement, []);
  const rating = useAsync(getRatingStatus, []);
  const bmi = user.profile?.heightCm && user.profile?.weightKg
    ? Number((Number(user.profile.weightKg) / (Number(user.profile.heightCm) / 100) ** 2).toFixed(1))
    : undefined;
  const milkData = useAsync(() => getMilkRecommendations({ bmi }), [bmi]);

  const savedMilkId = milkData.data?.currentPreference?.selectedFlavorId;
  const activeMilkId = milkSelected || savedMilkId;
  const streakDays = stats.data?.streakDays ?? 0;
  const totalWorkouts = stats.data?.totalWorkouts ?? 0;
  const totalKcal = stats.data?.totalKcalBurned ?? 0;
  const fmtKcal = totalKcal >= 1000 ? `${(totalKcal / 1000).toFixed(1)}k` : String(totalKcal);

  const achievementTitle = streakDays >= 60 ? 'Người bất khuất'
    : streakDays >= 28 ? 'Người kiên trì'
    : streakDays >= 14 ? 'Người chăm chỉ'
    : streakDays >= 7 ? 'Người mới bắt đầu'
    : 'Đang xây dựng thói quen';

  function getMilestoneState(days: number): 'active' | 'done' | 'locked' {
    if (streakDays < days) return 'locked';
    const nextIdx = MILESTONES.findIndex((m) => m.days > streakDays);
    const topIdx = nextIdx === -1 ? MILESTONES.length - 1 : nextIdx - 1;
    return MILESTONES[topIdx]?.days === days ? 'active' : 'done';
  }

  useEffect(() => {
    if (entitlement.data?.hasActiveEntitlement && rating.data?.status === 'eligible') setRatingOpen(true);
  }, [entitlement.data?.hasActiveEntitlement, rating.data?.status]);

  async function saveProfile() {
    const profile = await updateProfile({ name: editName, age: Number(editAge), heightCm: Number(editHeight), weightKg: Number(editWeight), goalType: editGoal, waterGoal: editWater });
    const next = { ...user, name: profile.name, profile: profile.profile };
    updateStoredUser(next);
    setUser(next);
    setMsg('Đã lưu hồ sơ.');
    setTimeout(() => setMsg(''), 2000);
  }

  async function redeem() {
    await redeemCode(code);
    setCode('');
    setRatingOpen(true);
    void entitlement.reload();
  }

  async function saveMilk() {
    if (!activeMilkId) return;
    await selectMilk({
      selectedFlavorId: activeMilkId,
      recommendedFlavorId: milkData.data?.flavors?.[0]?.flavorId,
      bmi,
      source: 'manual_profile',
    });
    void milkData.reload();
  }

  const confirmLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất không?')) onLogout();
  };

  return (
    <div className="screen p-screen">
      <div className="p-header">
        <div className="p-avatar"><User size={36} /></div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <div className="p-stats">
          <div className="p-stat"><strong>{streakDays}</strong><span>Ngày streak</span></div>
          <div className="p-stat"><strong>{totalWorkouts}</strong><span>Bài tập</span></div>
          <div className="p-stat"><strong>{fmtKcal}</strong><span>Calo đốt</span></div>
        </div>
      </div>
      <div className="p-body">
        {/* Scan account banner */}
        <div className={`p-scan-ban ${entitlement.data?.hasActiveEntitlement ? 'p-scan-ban-active' : 'p-scan-ban-inactive'}`}>
          <div className="p-scan-ban-icon">
            {entitlement.data?.hasActiveEntitlement ? <Sparkles size={22} /> : <LockOpen size={22} />}
          </div>
          <div>
            <strong>{entitlement.state === 'loading' ? 'Đang kiểm tra...' : entitlement.data?.hasActiveEntitlement ? 'Tài khoản scan AI đang active' : 'Tài khoản scan AI chưa active'}</strong>
            <p>{entitlement.data?.hasActiveEntitlement
              ? `${entitlement.data.quotaPolicy?.dailyLimit || 30} lượt scan AI mỗi ngày${entitlement.data.activeUntil ? ` đến ${new Date(entitlement.data.activeUntil).toLocaleDateString('vi-VN')}` : ''}.`
              : 'Nhập mã trong chai sữa Ủ để mở gói 30 lượt scan AI mỗi ngày.'}</p>
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <SectionTitle title="Thông tin cá nhân" />
        <div className="p-card">
          <InfoRow icon={<Mail size={18} />} label="Email" value={user.email} />
          <InfoRow icon={<CalendarDays size={18} />} label="Tuổi" value={user.profile?.age ? `${user.profile.age} tuổi` : '—'} />
          <InfoRow icon={<Ruler size={18} />} label="Chiều cao" value={user.profile?.heightCm ? `${user.profile.heightCm} cm` : '—'} action="Cập nhật" onAction={() => setEditOpen(true)} />
          <InfoRow icon={<Scale size={18} />} label="Cân nặng" value={user.profile?.weightKg ? `${user.profile.weightKg} kg` : '—'} action="Cập nhật" onAction={() => setEditOpen(true)} />
          <InfoRow icon={<Trophy size={18} />} label="Mục tiêu" value={GOAL_LABEL[user.profile?.goalType ?? ''] ?? '—'} action="Thay đổi" onAction={() => setEditOpen(true)} />
          <InfoRow icon={<BarChart3 size={18} />} label="Chỉ số BMI" value="Xem chi tiết" action="→" onAction={() => setPage('bmi')} last />
        </div>

        {/* Gói scan AI */}
        <SectionTitle title="Gói scan AI" />
        <Field label="Mã campaign" value={code} onChange={setCode} placeholder="Nhập mã trong chai sữa Ủ" />
        <Button onClick={redeem} disabled={!code.trim()}>Kích hoạt mã</Button>

        {/* Sữa Ủ phù hợp */}
        <SectionTitle title="Sữa Ủ phù hợp" />
        <div className="p-card">
          <p className="p-milk-dsc">{milkData.data?.disclaimer ?? 'Gợi ý sản phẩm theo sở thích và thể trạng, không phải tư vấn y khoa.'}</p>
          {(milkData.data?.flavors || []).map((flavor: any) => {
            const sel = activeMilkId === flavor.flavorId;
            return (
              <button key={flavor.flavorId} className={`p-milk-opt ${sel ? 'p-milk-sel' : ''}`} onClick={() => setMilkSelected(flavor.flavorId)}>
                <div>
                  <strong>{flavor.nameVi}</strong>
                  <p>{flavor.positioningVi}</p>
                </div>
                {sel ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </button>
            );
          })}
          {activeMilkId && <button className="p-milk-save" onClick={saveMilk}>{savedMilkId ? 'Cập nhật lựa chọn' : 'Lưu lựa chọn'}</button>}
        </div>

        {/* Thành tích */}
        <SectionTitle title="Thành tích" />
        <div className="p-achieve">
          <div className="p-achieve-hero">
            <div className="p-achieve-icon"><Ribbon size={28} /></div>
            <div>
              <strong>{achievementTitle}</strong>
              <span>Duy trì {streakDays} ngày liên tiếp</span>
            </div>
          </div>
          <div className="p-achieve-row">
            {MILESTONES.map(({ days, icon: Icon }) => (
              <MilestoneBadge key={days} days={days} Icon={Icon} state={getMilestoneState(days)} />
            ))}
          </div>
        </div>

        {/* Cài đặt */}
        <SectionTitle title="Cài đặt" />
        <div className="p-card">
          <SettingsRow icon={<Bell size={20} />} label="Thông báo" onPress={() => setPage('notifications')} />
          <SettingsRow icon={<Shield size={20} />} label="Quyền riêng tư" onPress={() => setPage('help')} />
          <SettingsRow icon={<HelpCircle size={20} />} label="Trợ giúp & Hỗ trợ" onPress={() => setPage('help')} />
          <SettingsRow icon={<LockOpen size={20} />} label="Đăng xuất" onPress={confirmLogout} danger last />
        </div>

        {/* Footer */}
        <div className="p-footer">
          <span>Ủ App · Phiên bản 1.0.0</span>
          <span>© 2026 Ú Health & Wellness</span>
        </div>
      </div>

      {/* Edit profile modal */}
      {editOpen && (
        <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Chỉnh sửa hồ sơ</h2>
            <div className="p-edit-fields">
              <label className="field"><span>TÊN HIỂN THỊ</span><input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nhập tên của bạn" /></label>
              <label className="field"><span>TUỔI</span><input type="number" value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} placeholder="25" /></label>
              <label className="field"><span>CHIỀU CAO (cm)</span><input type="number" value={editHeight} onChange={(e) => setEditHeight(Number(e.target.value))} placeholder="170" /></label>
              <label className="field"><span>CÂN NẶNG (kg)</span><input type="number" value={editWeight} onChange={(e) => setEditWeight(Number(e.target.value))} placeholder="65" /></label>
              <span className="p-edit-lbl">MỤC TIÊU SỨC KHỎE</span>
              <div className="p-goal-row">
                {(['lose', 'maintain', 'gain'] as const).map((g) => (
                  <button key={g} className={`p-goal-opt ${editGoal === g ? 'p-goal-sel' : ''}`} onClick={() => setEditGoal(g)}>{GOAL_LABEL[g]}</button>
                ))}
              </div>
              <span className="p-edit-lbl">MỤC TIÊU NƯỚC MỖI NGÀY (LY)</span>
              <div className="p-water-row">
                <button className="p-water-btn p-water-out" onClick={() => setEditWater(v => Math.max(4, v - 1))} disabled={editWater <= 4}>−</button>
                <span className="p-water-val">{editWater}</span>
                <button className="p-water-btn p-water-fill" onClick={() => setEditWater(v => Math.min(16, v + 1))} disabled={editWater >= 16}>+</button>
              </div>
            </div>
            <Button onClick={saveProfile}>Lưu thay đổi</Button>
            {msg && <p className="success" style={{ marginTop: 8 }}>{msg}</p>}
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {ratingOpen && <RatingModal onClose={() => { setRatingOpen(false); void rating.reload(); }} />}
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
    setMsg('Đã lưu lịch nhắc.');
  }

  return (
    <div className="screen n-screen">
      <div className="n-header">
        <h1>Thông báo</h1>
        <p>Quản lý lịch nhắc sức khỏe</p>
      </div>
      <div className="n-body">
        <div className="n-card">
          <Toggle label="Nhắc uống nước" value={form.waterReminder} onChange={(v) => setForm({ ...form, waterReminder: v })} />
          {form.waterReminder && (
            <div className="n-times">
              {form.waterReminderTimes.map((time, index) => (
                <Field key={index} label={`Lần ${index + 1}`} value={time} type="time" onChange={(v) => {
                  const next = [...form.waterReminderTimes];
                  next[index] = v;
                  setForm({ ...form, waterReminderTimes: next });
                }} />
              ))}
            </div>
          )}
        </div>
        <div className="n-card">
          <Toggle label="Nhắc tập luyện" value={form.workoutReminder} onChange={(v) => setForm({ ...form, workoutReminder: v })} />
          {form.workoutReminder && <Field label="Giờ tập luyện" value={form.workoutReminderTime} type="time" onChange={(v) => setForm({ ...form, workoutReminderTime: v })} />}
        </div>
        <div className="n-card">
          <Toggle label="Nhắc uống sữa Ủ" value={form.nutMilkReminder} onChange={(v) => setForm({ ...form, nutMilkReminder: v })} />
          {form.nutMilkReminder && <Field label="Giờ uống sữa Ủ" value={form.nutMilkReminderTime} type="time" onChange={(v) => setForm({ ...form, nutMilkReminderTime: v })} />}
        </div>
        <Button onClick={save}>Lưu thông báo</Button>
        {msg && <p className="success">{msg}</p>}
      </div>
    </div>
  );
}

function HelpScreen() {
  const [copied, setCopied] = useState(false);
  const FAQ = [
    { q: 'Làm thế nào để cập nhật cân nặng?', a: 'Vào tab BMI, dùng thanh trượt để chọn cân nặng và chiều cao mới, sau đó nhấn Lưu.' },
    { q: 'Dữ liệu của tôi có được lưu an toàn không?', a: 'Có. Tất cả dữ liệu được lưu trữ trên MongoDB Atlas với mã hóa khi truyền và khi lưu. Mật khẩu được hash bằng bcrypt.' },
    { q: 'Cách tính streak là gì?', a: 'Streak là số ngày liên tiếp bạn đánh dấu hoàn thành ít nhất 3 thói quen trong 6 thói quen mặc định.' },
    { q: 'Tôi có thể xóa tài khoản không?', a: 'Có. Vào Trang cá nhân > Cài đặt > Xóa tài khoản để xóa tài khoản và dữ liệu cá nhân khỏi hệ thống.' },
  ];

  function copyEmail() {
    navigator.clipboard.writeText('uchamsocsuckhoe88@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="screen hlp-screen">
      <div className="hlp-header">
        <h1>Trợ giúp & Hỗ trợ</h1>
        <p>Câu hỏi thường gặp và liên hệ</p>
      </div>
      <div className="hlp-body">
        <div className="hlp-card">
          <strong className="hlp-card-title">Câu hỏi thường gặp</strong>
          {FAQ.map((item) => (
            <details className="hlp-faq" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <div className="hlp-card">
          <div className="hlp-contact">
            <Mail size={20} />
            <span>uchamsocsuckhoe88@gmail.com</span>
            <button className="hlp-copy" onClick={copyEmail}>{copied ? 'Đã sao chép!' : 'Sao chép'}</button>
          </div>
          <div className="hlp-divider" />
          <div className="hlp-version">
            <span>Phiên bản ứng dụng</span>
            <span>1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <section className="privacy-card">
        <div className="privacy-brand">
          <img src="/assets/logo.png" alt="Ủ Health" />
          <div>
            <p>Ủ Health</p>
            <h1>Privacy Policy</h1>
          </div>
        </div>
        <p className="privacy-updated">Last updated: June 2, 2026</p>

        <p>
          Ủ Health helps users track wellness habits, meals, water intake, workouts, BMI, and personalized
          Ủ milk recommendations. This Privacy Policy explains what information we collect and how we use it.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We may collect account information such as name and email address, profile information such as age,
          height, weight, health goals, BMI-related data, notification preferences, meal logs, workout activity,
          water intake, habit check-ins, app ratings, and images that users choose to upload for meal scanning.
        </p>

        <h2>How We Use Information</h2>
        <p>
          We use this information to provide app functionality, personalize recommendations, calculate wellness
          summaries, process AI-assisted food analysis, manage scan-code entitlements, send reminders, improve
          reliability, and provide support.
        </p>

        <h2>AI and Health Information</h2>
        <p>
          AI-generated meal analysis, nutrition information, BMI insights, and Ủ milk recommendations are for
          informational and lifestyle purposes only. They are not medical advice, diagnosis, or treatment.
        </p>

        <h2>Sharing and Third Parties</h2>
        <p>
          We do not sell personal data. We may use service providers to host the backend, store data, process
          images, send notifications, authenticate users, and support AI-assisted analysis. These services only
          process data needed to operate the app.
        </p>

        <h2>Data Retention and Deletion</h2>
        <p>
          We retain user data while the account is active or as needed to provide the service. Users can delete
          their account in the app from Profile &gt; Settings &gt; Delete Account, or contact support for data questions.
        </p>

        <h2>Security</h2>
        <p>
          We use reasonable technical safeguards, including encrypted transport and password hashing, to protect
          user information. No method of transmission or storage is completely secure.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions or data requests, contact us at{' '}
          <a href="mailto:uchamsocsuckhoe88@gmail.com">uchamsocsuckhoe88@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}

function MilkPublicPage() {
  const [content, setContent] = useState<MilkPageContent | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let mounted = true;
    getMilkPageContent()
      .then((data) => {
        if (!mounted) return;
        setContent(data);
        setLoadState('idle');
      })
      .catch(() => {
        if (!mounted) return;
        setLoadState('error');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const download = content?.download;

  return (
    <main className="milk-public-page">
      <section className="milk-hero">
        <div className="milk-hero-copy">
          <img src="/assets/logo.png" alt="Ủ" />
          <p className="milk-eyebrow">Ủ - chăm sóc sức khỏe</p>
          <h1>Các vị sữa Ủ</h1>
          <p>
            Chọn vị sữa hạt phù hợp với thể trạng, nhu cầu năng lượng và nhịp sống mỗi ngày của bạn.
          </p>
          <div className="milk-store-buttons milk-hero-buttons">
            {download?.appStoreUrl ? (
              <a href={download.appStoreUrl}><StoreGlyph type="apple" /> App Store</a>
            ) : (
              <span><StoreGlyph type="apple" /> App Store sắp có</span>
            )}
            {download?.playStoreUrl ? (
              <a href={download.playStoreUrl}><StoreGlyph type="play" /> CH Play</a>
            ) : (
              <span><StoreGlyph type="play" /> CH Play sắp có</span>
            )}
          </div>
        </div>
        <div className="milk-hero-download" id="download-app">
          <p className="milk-eyebrow">Tải ứng dụng</p>
          <h2>{download?.headlineVi || 'Tải app Ủ'}</h2>
          <p>{download?.copyVi || 'Theo dõi sức khỏe, bữa ăn, tập luyện và nhận gợi ý sữa Ủ phù hợp.'}</p>
          <div className="milk-qr-grid">
            <QrBlock label="App Store" url={download?.appStoreUrl} qrUrl={download?.appStoreQrUrl} />
            <QrBlock label="CH Play" url={download?.playStoreUrl} qrUrl={download?.playStoreQrUrl} />
          </div>
        </div>
      </section>

      <section className="milk-section">
        <div className="milk-section-head">
          <div>
            <p className="milk-eyebrow">Danh sách vị</p>
            <h2>Sữa hạt của Ủ</h2>
          </div>
        </div>

        {loadState === 'loading' ? (
          <div className="milk-grid">
            {Array.from({ length: 6 }).map((_, idx) => <div className="milk-card milk-card-loading" key={idx} />)}
          </div>
        ) : loadState === 'error' ? (
          <div className="milk-error">Chưa tải được danh sách vị sữa. Vui lòng thử lại sau.</div>
        ) : (
          <div className="milk-grid">
            {content?.flavors.map((flavor) => (
              <article className="milk-card" key={flavor.flavorId}>
                <div className="milk-image-wrap">
                  {flavor.imageUrl ? (
                    <img src={flavor.imageUrl} alt={flavor.nameVi} />
                  ) : (
                    <div className="milk-placeholder">
                      <ImageUp />
                      <span>Đang cập nhật ảnh</span>
                    </div>
                  )}
                </div>
                <div className="milk-card-body">
                  <span>{milkBmiLabel(flavor.bmiRule)}</span>
                  <h3>{flavor.nameVi}</h3>
                  <p>{flavor.positioningVi}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StoreGlyph({ type }: { type: 'apple' | 'play' }) {
  return (
    <span className={`milk-store-glyph milk-store-glyph-${type}`} aria-hidden="true">
      {type === 'apple' ? (
        <Apple size={18} strokeWidth={2.6} />
      ) : (
        <svg viewBox="0 0 24 24" role="img">
          <path className="play-mark-blue" d="M4.2 3.4c-.3.3-.5.7-.5 1.2v14.8c0 .5.2.9.5 1.2l8.7-8.6-8.7-8.6Z" />
          <path className="play-mark-green" d="m13 12 2.6-2.6L6.1 3.9 13 12Z" />
          <path className="play-mark-yellow" d="m13 12-6.9 8.1 9.5-5.5L13 12Z" />
          <path className="play-mark-red" d="m15.6 9.4-2.6 2.6 2.6 2.6 3.5-2c1.1-.6 1.1-2.2 0-2.8l-3.5-2Z" />
        </svg>
      )}
    </span>
  );
}

function QrBlock({ label, url, qrUrl }: { label: string; url?: string | null; qrUrl?: string | null }) {
  const type = label === 'App Store' ? 'apple' : 'play';

  return (
    <a className="milk-qr-card" href={url ?? '#'} aria-disabled={!url}>
      {qrUrl ? (
        <img src={qrUrl} alt={`QR tải app trên ${label}`} />
      ) : (
        <div className="milk-qr-placeholder">
          <QrCode />
          <span>QR đang cập nhật</span>
        </div>
      )}
      <strong><StoreGlyph type={type} /> {label}</strong>
    </a>
  );
}

function milkBmiLabel(rule: string): string {
  if (rule === 'lt_18_5') return 'BMI < 18.5';
  if (rule === 'range_18_5_22_9') return 'BMI 18.5 - 24.9';
  if (rule === 'gt_23') return 'BMI >= 25';
  return 'Mọi chỉ số BMI';
}

function App() {
  if (window.location.pathname === '/privacy') return <PrivacyPolicyPage />;
  if (window.location.pathname === '/milk') return <MilkPublicPage />;

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
      {page === 'help' && <HelpScreen />}
    </Shell>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
