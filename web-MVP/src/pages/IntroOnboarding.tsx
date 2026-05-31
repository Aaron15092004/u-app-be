import { useState } from 'react';
import { CalendarDays, Flashlight, Heart, Laugh, Salad, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui';

const LOGO_URL = '/assets/logo.png';
const INTRO_KEY = 'u_web_seen_intro';

export function IntroOnboarding({ onDone }: { onDone: (mode: 'login' | 'register') => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    {
      title: 'Chào mừng đến với Ủ',
      subtitle: 'Ứng dụng quản lý sức khỏe toàn diện với dinh dưỡng từ thực vật',
      visual: <img src={LOGO_URL} alt="Ủ" className="intro-logo" />,
    },
    {
      title: 'Theo dõi sức khỏe hàng ngày',
      subtitle: 'Phân tích bữa ăn, theo dõi BMI, và quản lý lịch tập luyện một cách dễ dàng',
      visual: (
        <div className="feature-tiles" aria-hidden="true">
          <span><Salad size={32} /></span>
          <span><TrendingUp size={32} /></span>
          <span><CalendarDays size={32} /></span>
        </div>
      ),
    },
    {
      title: 'Bắt đầu hành trình khỏe mạnh',
      subtitle: 'Xây dựng thói quen lành mạnh và đạt được mục tiêu sức khỏe của bạn',
      visual: (
        <div className="heroWrapper" aria-hidden="true">
          <div className="heroCircle"><Heart size={88} fill="currentColor" /></div>
          <div className="badge badgeTopRight"><Laugh size={24} /></div>
          <div className="badge badgeBottomLeft"><Flashlight size={24} /></div>
        </div>
      ),
    },
  ];
  const current = slides[step];

  function choose(mode: 'login' | 'register') {
    localStorage.setItem(INTRO_KEY, '1');
    onDone(mode);
  }

  return (
    <div className="mobile-stage">
      <section className="intro-screen">
        <div className="intro-content">
          <div className="logoContainer">{current.visual}</div>
          <h1>{current.title}</h1>
          <p>{current.subtitle}</p>
        </div>
        <div className="intro-bottom">
          <div className="dots">{slides.map((_, index) => <span key={index} className={index === step ? 'active' : ''} />)}</div>
          {step === slides.length - 1 ? (
            <>
              <Button onClick={() => choose('register')}>Tạo tài khoản</Button>
              <Button variant="ghost" onClick={() => choose('login')}>Đăng nhập</Button>
            </>
          ) : (
            <Button onClick={() => setStep(step + 1)}>Tiếp tục</Button>
          )}
        </div>
      </section>
    </div>
  );
}
