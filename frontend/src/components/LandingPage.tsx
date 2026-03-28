import { useEffect, useRef, useState, useCallback } from "react";
import "./LandingPage.css";

const ADVISORS = [
  { name: "Steve Jobs", domain: "Innovation & Design", color: "#3B82F6", quote: "Is this elegant? Would you be proud of it?" },
  { name: "Warren Buffett", domain: "Long-term Value", color: "#10B981", quote: "Would you still like this decision in 10 years?" },
  { name: "Indra Nooyi", domain: "Strategy & People", color: "#EC4899", quote: "How do the humans inside this organization experience it?" },
  { name: "Andy Grove", domain: "Operations & OKRs", color: "#F97316", quote: "Only the paranoid survive. What's the inflection point?" },
  { name: "Elon Musk", domain: "Disruption & Scale", color: "#EF4444", quote: "How do you 10x this? What assumption is everyone afraid to question?" },
  { name: "Mark Cuban", domain: "Commercial Traction", color: "#8B5CF6", quote: "Who owns the IP? What's the actual revenue model?" },
  { name: "Sun Tzu", domain: "Power & Positioning", color: "#DC2626", quote: "Who has positional advantage? What does timing dictate?" },
  { name: "Nelson Mandela", domain: "Ethics & Values", color: "#F59E0B", quote: "Does this align with your core values? What does courage require?" },
  { name: "Oprah Winfrey", domain: "Narrative & Truth", color: "#D946EF", quote: "What's the real story underneath this? What does your gut say?" },
  { name: "Meg Whitman", domain: "Operations & Scale", color: "#06B6D4", quote: "What does integration actually cost? How do you build for scale?" },
  { name: "Buddha", domain: "Clarity & Detachment", color: "#A3E635", quote: "What fear or ego is driving this? What are you attached to?" },
];

const FEATURES = [
  { icon: "👥", title: "11 Iconic Advisors", desc: "Each with unique voice DNA, real thinking frameworks, and calibrated personas" },
  { icon: "💬", title: "Board Deliberation", desc: "Multi-round debates where advisors challenge and build on each other's positions" },
  { icon: "📋", title: "Consensus Reports", desc: "AI moderator synthesizes agreements, tensions, and recommended actions" },
  { icon: "✨", title: "Custom Advisors", desc: "Build your own advisor with custom voice, domain, and thinking frameworks" },
  { icon: "📚", title: "Session History", desc: "Revisit past board sessions and track how your thinking evolves" },
  { icon: "\u{1F9D1}", title: "User Profiles", desc: "Multiple life domains for contextual advice" },
  { icon: "📱", title: "Mobile Responsive", desc: "Full board experience on any device — phone, tablet, or desktop" },
  { icon: "🔒", title: "Private & Secure", desc: "Per-user data isolation, JWT authentication, no data sharing" },
];

const FAQS = [
  { q: "How realistic are the advisor personas?", a: "Each advisor has unique Voice DNA — custom speech patterns, real thinking frameworks, calibrated quotes, and per-advisor temperature tuning. They respond in their authentic voice, not as generic chatbots." },
  { q: "Can I add my own advisors?", a: "Yes! You can create custom personas with your own name, domain, challenge lens, and system prompt. Build advisors modeled on mentors, historical figures, or domain experts." },
  { q: "Is my data private?", a: "Absolutely. Every user has isolated data storage with JWT authentication. Your sessions, questions, and advisor interactions are never shared with other users." },
  { q: "What AI model powers this?", a: "ConveneAgent uses GPT-4o with per-advisor temperature tuning — more creative advisors like Cuban and Musk run hotter, while analytical minds like Buddha and Sun Tzu run cooler for precision." },
  { q: "Can advisors access real-time data?", a: "Coming soon! We're building web search, financial data, and SEC filing integrations so advisors like Buffett can reference real market data and Cuban can pull actual unit economics." },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.unobserve(el); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`landing-fade-in ${className}`}>{children}</div>;
}

export default function LandingPage({ onSignIn, onStartTrial }: { onSignIn: () => void; onStartTrial: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">ConveneAgent</div>
        <div className="landing-nav-links">
          <button className="landing-nav-link" onClick={() => scrollTo("how-it-works")}>How It Works</button>
          <button className="landing-nav-link" onClick={() => scrollTo("advisors")}>Advisors</button>
          <button className="landing-nav-link" onClick={() => scrollTo("pricing")}>Pricing</button>
          <button className="landing-nav-link" onClick={() => scrollTo("faq")}>FAQ</button>
          <button className="landing-nav-signin" onClick={onSignIn}>Sign In</button>
          <button className="landing-nav-cta" onClick={onStartTrial}>Start Free Trial</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <Reveal>
          <div className="landing-hero-badge">✦ Your Personal AI Board of Directors</div>
        </Reveal>
        <Reveal>
          <h1>Convene the Greatest Minds on Your Toughest Decisions</h1>
        </Reveal>
        <Reveal>
          <p className="landing-hero-sub">
            Steve Jobs, Warren Buffett, Andy Grove, and 8 more iconic advisors — each with authentic voice DNA and real thinking frameworks. Available 24/7 to debate your biggest questions.
          </p>
        </Reveal>
        <Reveal>
          <div className="landing-hero-ctas">
            <button className="landing-btn-primary" onClick={onStartTrial}>Start Free Trial</button>
            <button className="landing-btn-ghost" onClick={() => scrollTo("how-it-works")}>See How It Works</button>
          </div>
        </Reveal>
        <Reveal>
          <div className="landing-hero-preview">
            <div className="landing-preview-header">
              <div className="landing-preview-dot" style={{ background: "#EF4444" }} />
              <div className="landing-preview-dot" style={{ background: "#F59E0B" }} />
              <div className="landing-preview-dot" style={{ background: "#10B981" }} />
              <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>Board Session — &quot;Should I leave my VP role to start a company?&quot;</span>
            </div>
            <div className="landing-preview-cards">
              <div className="landing-preview-card" style={{ borderColor: "#3B82F6" }}>
                <div className="landing-preview-card-name" style={{ color: "#3B82F6" }}>Steve Jobs</div>
                <div className="landing-preview-card-text">&quot;The question isn&apos;t whether you can build it — it&apos;s whether you&apos;d be proud of how you spent your time if this was your last year...&quot;</div>
              </div>
              <div className="landing-preview-card" style={{ borderColor: "#10B981" }}>
                <div className="landing-preview-card-name" style={{ color: "#10B981" }}>Warren Buffett</div>
                <div className="landing-preview-card-text">&quot;What&apos;s the opportunity cost? Calculate your margin of safety — how many months of runway versus your current golden handcuffs...&quot;</div>
              </div>
              <div className="landing-preview-card" style={{ borderColor: "#F97316" }}>
                <div className="landing-preview-card-name" style={{ color: "#F97316" }}>Andy Grove</div>
                <div className="landing-preview-card-text">&quot;This sounds like a strategic inflection point. The question is: if you were already CEO, would you hire yourself as founder?&quot;</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* How It Works */}
      <section className="landing-section" id="how-it-works">
        <Reveal>
          <div className="landing-section-label">How It Works</div>
          <h2 className="landing-section-title">Three steps to better decisions</h2>
          <p className="landing-section-sub">No setup. No onboarding. Ask a question and get multi-perspective strategic advice in seconds.</p>
        </Reveal>
        <Reveal>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <h3>Choose Your Board</h3>
              <p>Select from 11 iconic advisors across strategy, innovation, ethics, finance, and more. Each brings their real-world thinking frameworks.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <h3>Ask Your Question</h3>
              <p>Submit any strategic question — career moves, business decisions, investments, life choices. No topic is off limits.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <h3>Get Multi-Perspective Advice</h3>
              <p>Each advisor responds in their authentic voice. Then let them debate each other — and get an AI-synthesized consensus report.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Meet the Board */}
      <section className="landing-section" id="advisors">
        <Reveal>
          <div className="landing-section-label">Meet the Board</div>
          <h2 className="landing-section-title">11 iconic minds. One boardroom.</h2>
          <p className="landing-section-sub">Each advisor has unique Voice DNA — authentic speech patterns, real thinking frameworks, and calibrated personality.</p>
        </Reveal>
        <Reveal>
          <div className="landing-advisors-grid">
            {ADVISORS.map((a) => (
              <div key={a.name} className="landing-advisor-card" style={{ borderTopColor: a.color }}>
                <div style={{ position: "relative" }}>
                  <div className="landing-advisor-card::before" style={{ background: a.color }} />
                  <div className="landing-advisor-name" style={{ color: a.color }}>{a.name}</div>
                  <div className="landing-advisor-domain" style={{ color: a.color, opacity: 0.7 }}>{a.domain}</div>
                  <div className="landing-advisor-quote">&quot;{a.quote}&quot;</div>
                </div>
              </div>
            ))}
            <div className="landing-advisor-custom">
              <div className="landing-advisor-custom-icon">+</div>
              <h4>Build Your Own</h4>
              <p>Create custom advisors with any voice and expertise</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Deliberation */}
      <section className="landing-delib" id="deliberation">
        <div className="landing-delib-inner">
          <Reveal>
            <div className="landing-section-label">The Deliberation</div>
            <h2 className="landing-section-title">They don&apos;t just advise. They debate.</h2>
            <p className="landing-section-sub">Your advisors challenge each other&apos;s assumptions, find blind spots, and build on each other&apos;s ideas — just like a real board.</p>
          </Reveal>
          <Reveal>
            <div className="landing-delib-content">
              <div className="landing-delib-text">
                <div className="landing-delib-flow">
                  <div className="landing-delib-flow-step">
                    <div className="landing-delib-flow-icon" style={{ background: "rgba(124, 58, 237, 0.1)", color: "#A78BFA" }}>1</div>
                    <div>
                      <div className="landing-delib-flow-label">Initial Takes</div>
                      <div className="landing-delib-flow-desc">Each advisor gives their independent perspective</div>
                    </div>
                  </div>
                  <div className="landing-delib-flow-step">
                    <div className="landing-delib-flow-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444" }}>2</div>
                    <div>
                      <div className="landing-delib-flow-label">Debate Rounds</div>
                      <div className="landing-delib-flow-desc">Advisors challenge, rebut, and build on each other</div>
                    </div>
                  </div>
                  <div className="landing-delib-flow-step">
                    <div className="landing-delib-flow-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>3</div>
                    <div>
                      <div className="landing-delib-flow-label">Consensus Report</div>
                      <div className="landing-delib-flow-desc">AI moderator synthesizes agreements, tensions, and actions</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="landing-delib-example">
                <div className="landing-delib-msg" style={{ borderColor: "#3B82F6", background: "rgba(59, 130, 246, 0.05)" }}>
                  <div className="landing-delib-msg-name" style={{ color: "#3B82F6" }}>Steve Jobs</div>
                  <div className="landing-delib-msg-text">&quot;Warren, your margin-of-safety math is fine for buying stocks. But building something that matters requires a leap of faith, not a spreadsheet.&quot;</div>
                </div>
                <div className="landing-delib-msg" style={{ borderColor: "#10B981", background: "rgba(16, 185, 129, 0.05)" }}>
                  <div className="landing-delib-msg-name" style={{ color: "#10B981" }}>Warren Buffett</div>
                  <div className="landing-delib-msg-text">&quot;Steve, you&apos;re confusing courage with recklessness. The best founders I&apos;ve backed had conviction AND a clear margin of safety. Those aren&apos;t opposites.&quot;</div>
                </div>
                <div className="landing-delib-msg" style={{ borderColor: "#F97316", background: "rgba(249, 115, 22, 0.05)" }}>
                  <div className="landing-delib-msg-name" style={{ color: "#F97316" }}>Andy Grove</div>
                  <div className="landing-delib-msg-text">&quot;You&apos;re both right and both wrong. The real question is: what are the measurable OKRs for the first 90 days? That&apos;s how you de-risk the leap.&quot;</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section" id="features">
        <Reveal>
          <div className="landing-section-label">Features</div>
          <h2 className="landing-section-title">Everything you need for better decisions</h2>
          <p className="landing-section-sub">A complete advisory platform, not just another AI chatbot.</p>
        </Reveal>
        <Reveal>
          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Pricing */}
      <section className="landing-pricing" id="pricing">
        <div className="landing-pricing-inner">
          <Reveal>
            <div className="landing-section-label">Pricing</div>
            <h2 className="landing-section-title">Start free. Upgrade when you&apos;re ready.</h2>
            <p className="landing-section-sub">No credit card required. Try the full board experience before committing.</p>
          </Reveal>
          <Reveal>
            <div className="landing-pricing-cards">
              {/* Free */}
              <div className="landing-pricing-card">
                <div className="landing-pricing-name">Free Trial</div>
                <div className="landing-pricing-price">$0</div>
                <div className="landing-pricing-annual">No credit card required</div>
                <ul className="landing-pricing-features">
                  <li><span className="landing-pricing-check">✓</span> 3 board sessions</li>
                  <li><span className="landing-pricing-check">✓</span> All 11 advisors</li>
                  <li><span className="landing-pricing-check">✓</span> Board deliberation</li>
                  <li><span className="landing-pricing-check">✓</span> Consensus reports</li>
                </ul>
                <button className="landing-pricing-btn secondary" onClick={onStartTrial}>Get Started</button>
              </div>

              {/* Pro */}
              <div className="landing-pricing-card featured">
                <div className="landing-pricing-popular">Most Popular</div>
                <div className="landing-pricing-name">Pro</div>
                <div className="landing-pricing-price">$19<span>/month</span></div>
                <div className="landing-pricing-annual">or $149/year (save 35%)</div>
                <ul className="landing-pricing-features">
                  <li><span className="landing-pricing-check">✓</span> Unlimited sessions</li>
                  <li><span className="landing-pricing-check">✓</span> Unlimited deliberation rounds</li>
                  <li><span className="landing-pricing-check">✓</span> Custom advisors</li>
                  <li><span className="landing-pricing-check">✓</span> Full session history</li>
                  <li><span className="landing-pricing-check">✓</span> Priority response times</li>
                  <li><span className="landing-pricing-check">✓</span> Export to PDF (coming soon)</li>
                </ul>
                <button className="landing-pricing-btn primary" onClick={onStartTrial}>Start Free Trial</button>
              </div>

              {/* Team */}
              <div className="landing-pricing-card">
                <div className="landing-pricing-name">Team</div>
                <div className="landing-pricing-price" style={{ color: "#666" }}>TBD</div>
                <div className="landing-pricing-annual">Coming Soon</div>
                <ul className="landing-pricing-features">
                  <li><span className="landing-pricing-check">✓</span> Everything in Pro</li>
                  <li><span className="landing-pricing-check">✓</span> Shared boards</li>
                  <li><span className="landing-pricing-check">✓</span> Team deliberation</li>
                  <li><span className="landing-pricing-check">✓</span> Admin controls</li>
                  <li><span className="landing-pricing-check">✓</span> Priority support</li>
                </ul>
                <button className="landing-pricing-btn disabled">Coming Soon</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Use Cases */}
      <section className="landing-section" id="use-cases">
        <Reveal>
          <div className="landing-section-label">Use Cases</div>
          <h2 className="landing-section-title">For every decision that matters</h2>
          <p className="landing-section-sub">From career crossroads to billion-dollar strategy — your board adapts to every context.</p>
        </Reveal>
        <Reveal>
          <div className="landing-usecases">
            <div className="landing-usecase">
              <div className="landing-usecase-icon">🔀</div>
              <h4>Career Crossroads</h4>
              <p>Should I take this job? Start a company? Retire early?</p>
            </div>
            <div className="landing-usecase">
              <div className="landing-usecase-icon">📊</div>
              <h4>Business Strategy</h4>
              <p>M&A decisions, product launches, market entry</p>
            </div>
            <div className="landing-usecase">
              <div className="landing-usecase-icon">💰</div>
              <h4>Investment Decisions</h4>
              <p>Portfolio strategy, acquisition targets, risk analysis</p>
            </div>
            <div className="landing-usecase">
              <div className="landing-usecase-icon">🌱</div>
              <h4>Personal Growth</h4>
              <p>Life planning, health goals, relationship decisions</p>
            </div>
            <div className="landing-usecase">
              <div className="landing-usecase-icon">👔</div>
              <h4>Leadership</h4>
              <p>Team conflicts, org design, culture questions</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="landing-section" id="faq">
        <Reveal>
          <div className="landing-section-label">FAQ</div>
          <h2 className="landing-section-title">Frequently asked questions</h2>
        </Reveal>
        <Reveal>
          <div className="landing-faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className="landing-faq-item">
                <button className="landing-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <span className={`landing-faq-arrow ${openFaq === i ? "open" : ""}`}>▼</span>
                </button>
                {openFaq === i && <div className="landing-faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="landing-cta-banner">
        <Reveal>
          <h2>Ready to convene your board?</h2>
          <p>Start with 3 free sessions. No credit card required.</p>
          <div className="landing-hero-ctas" style={{ justifyContent: "center" }}>
            <button className="landing-btn-primary" onClick={onStartTrial}>Start Free Trial</button>
            <button className="landing-btn-ghost" onClick={onSignIn}>Sign In</button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">ConveneAgent</div>
          <div className="landing-footer-links">
            <button className="landing-footer-link" onClick={() => scrollTo("features")}>Features</button>
            <button className="landing-footer-link" onClick={() => scrollTo("pricing")}>Pricing</button>
            <button className="landing-footer-link" onClick={() => scrollTo("faq")}>FAQ</button>
            <button className="landing-footer-link" onClick={onSignIn}>Sign In</button>
          </div>
        </div>
        <div className="landing-footer-copy">
          <p>Built with 🤖 by humans who believe the best decisions come from multiple perspectives</p>
          <p>&copy; 2026 ConveneAgent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
