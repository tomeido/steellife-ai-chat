'use client';

import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: 'white',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Hero Section */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 20px',
          background: 'rgba(212, 165, 116, 0.2)',
          borderRadius: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(212, 165, 116, 0.3)',
        }}>
          <span style={{ color: '#D4A574', fontSize: '14px', fontWeight: 500 }}>
            AI Customer Service
          </span>
        </div>

        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #fff 0%, #D4A574 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}>
          STEELLIFE<br />AI 고객 지원
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.7)',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          24시간 언제든지 STEELLIFE의 제품과 서비스에 대해 문의하세요.
          <br />
          한국어, English, 日本語, 中文 모두 지원합니다.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <a
            href="http://www.steellife.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '14px 32px',
              backgroundColor: '#8B5A2B',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 90, 43, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            STEELLIFE 홈페이지 방문
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '60px 20px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '32px',
          marginBottom: '48px',
          fontWeight: 600,
        }}>
          AI 챗봇 기능
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              icon: '🌍',
              title: '다국어 지원',
              desc: '한국어, 영어, 일본어, 중국어로 질문하면 해당 언어로 답변합니다.',
            },
            {
              icon: '📦',
              title: '제품 정보',
              desc: '워터웨이브 패널, 스틸 패널 시스템 등 제품에 대한 상세 정보를 제공합니다.',
            },
            {
              icon: '📞',
              title: '연락처 안내',
              desc: '견적, 설계 지원, 자재 문의 등 목적에 맞는 담당자를 안내합니다.',
            },
            {
              icon: '🏆',
              title: '시공 실적',
              desc: '필리핀 아레나, LH 진주 사옥 등 주요 프로젝트 정보를 제공합니다.',
            },
            {
              icon: '📋',
              title: '인증 정보',
              desc: 'ISO 9001, NET 신기술인증, Inno-Biz 등 보유 인증을 안내합니다.',
            },
            {
              icon: '⏰',
              title: '24시간 운영',
              desc: '언제든지 즉시 응답받을 수 있는 AI 고객 지원 서비스입니다.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                padding: '28px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s, border-color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(212, 165, 116, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Guide */}
      <section style={{
        padding: '60px 20px 80px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '32px',
          marginBottom: '32px',
          fontWeight: 600,
        }}>
          홈페이지 통합 가이드
        </h2>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>
            STEELLIFE 홈페이지에 이 챗봇을 추가하려면 아래 코드를 HTML에 삽입하세요:
          </p>
          <pre style={{
            background: '#1a1a2e',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: 1.6,
          }}>
            {`<iframe 
  src="https://[YOUR-VERCEL-URL]/widget"
  style="position:fixed; bottom:0; right:0; 
         width:420px; height:640px; 
         border:none; z-index:9999;"
  allow="clipboard-write"
></iframe>`}
          </pre>

        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
      }}>
        © 2026 STEELLIFE. AI Customer Service powered by Gemini.
      </footer>

      {/* Chat Widget */}
      <ChatWidget
        position="bottom-right"
        primaryColor="#8B5A2B"
        accentColor="#D4A574"
      />
    </main>
  );
}