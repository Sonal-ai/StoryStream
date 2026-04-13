import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, Zap, Shield, Hash, Bell, Users, MessageCircle,
  Heart, Search, Moon, ArrowRight, GitFork, Link2,
  ExternalLink, Play, FileText, ChevronDown, Star, Globe
} from 'lucide-react';

/* ─── Static data ─────────────────────────────────────── */
const FEATURES = [
  { icon: Zap,           title: 'Real‑time Feed',       desc: 'Personalized "For You" feed powered by who you follow with infinite scroll.' },
  { icon: Hash,          title: 'Smart Hashtags',        desc: 'Clickable hashtag pages aggregate posts instantly. Discover trending topics.' },
  { icon: Heart,         title: 'Animated Likes',        desc: 'Heart pop animation + floating particles when you like a post.' },
  { icon: MessageCircle, title: 'Inline Comments',       desc: 'Comments expand right inside the post card — no page redirect.' },
  { icon: Users,         title: 'Follow System',         desc: 'Follow users, get Follow‑Back suggestions, full follower/following lists.' },
  { icon: Bell,          title: 'Notifications',         desc: 'Real‑time in-app alerts for likes, comments and new followers.' },
  { icon: Search,        title: 'User Search',           desc: 'Search any user by username or bio. Instant results page.' },
  { icon: Moon,          title: 'Dark / Light Mode',     desc: 'Animated moon‑night / sun‑cloud toggle with warm reading palette.' },
  { icon: Shield,        title: 'Production Security',   desc: 'JWT auth, bcrypt, parameterized SQL, rate limiting & Helmet headers.' },
];

const TEAM = [
  {
    name: 'Sonal',
    role: 'Full‑Stack Developer',
    desc: 'Backend architecture, MySQL schema design, REST API, authentication.',
    seed: 'sonal2024',
    github: '#', linkedin: '#',
  },
  {
    name: 'Contributor 2',
    role: 'Frontend Developer',
    desc: 'React components, design system, animations, responsive UI.',
    seed: 'dev2024b',
    github: '#', linkedin: '#',
  },
];

const TECH_STACK = [
  { label: 'React 18',    color: '#61dafb' },
  { label: 'Vite',        color: '#b060f8' },
  { label: 'Node.js',     color: '#a6e3a1' },
  { label: 'Express',     color: '#9998b0' },
  { label: 'MySQL 8',     color: '#67c6e3' },
  { label: 'mysql2',      color: '#f38ba8' },
  { label: 'JWT',         color: '#f9e2af' },
];

/* ─── Component ───────────────────────────────────────── */
const LandingPage = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const videoRef   = useRef(null);

  // Auto-navigate logged-in users to feed after 0ms (instant)
  // But still show the landing page if they want to view it
  const handleGetStarted = () => navigate(user ? '/feed' : '/register');

  // Intersection observer for scroll reveals
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp-root">

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo"><Sparkles size={20} /> StoryStream</div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <a href="#team">Team</a>
            <a href="#report">Report</a>
          </div>
          <div className="lp-nav-cta">
            {user
              ? <Link to="/feed" className="lp-btn-primary">Go to Feed <ArrowRight size={15} /></Link>
              : <>
                  <Link to="/login"    className="lp-btn-ghost">Login</Link>
                  <Link to="/register" className="lp-btn-primary">Get Started <ArrowRight size={15} /></Link>
                </>
            }
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow lp-glow-1" />
        <div className="lp-hero-glow lp-glow-2" />
        <div className="lp-hero-glow lp-glow-3" />

        <div className="lp-hero-content">
          <div className="lp-badge"><Star size={12} /> Open Source Social Platform</div>
          <h1 className="lp-hero-title">
            Tell your story.<br />
            <span className="lp-gradient-text">Stream it to the world.</span>
          </h1>
          <p className="lp-hero-sub">
            A full‑stack Twitter‑like platform built with React, Node.js &amp; MySQL.
            Real‑time feeds, hashtags, dark mode, and enterprise‑grade security — all in one.
          </p>
          <div className="lp-hero-btns">
            <button className="lp-btn-primary lp-btn-lg" onClick={handleGetStarted}>
              {user ? 'Go to Feed' : 'Get Started — it\'s free'} <ArrowRight size={16} />
            </button>
            <a href="#demo" className="lp-btn-ghost lp-btn-lg">
              <Play size={16} /> Watch Demo
            </a>
          </div>
          <div className="lp-hero-meta">
            {TECH_STACK.map(t => (
              <span key={t.label} className="lp-tech-pill" style={{ borderColor: t.color + '55', color: t.color }}>
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* App mockup */}
        <div className="lp-hero-mockup">
          <div className="lp-mockup-window">
            <div className="lp-mockup-bar">
              <span className="lp-dot red" /><span className="lp-dot yellow" /><span className="lp-dot green" />
              <span className="lp-mockup-url">localhost:5173</span>
            </div>
            <div className="lp-mockup-body">
              {/* Fake feed preview */}
              <div className="lp-fake-navbar"><Sparkles size={14} /><span>StoryStream</span></div>
              {[1,2,3].map(i => (
                <div key={i} className="lp-fake-post">
                  <div className="lp-fake-avatar" style={{ background: i===1?'#7c6fcd':i===2?'#67c6e3':'#f38ba8' }} />
                  <div className="lp-fake-lines">
                    <div className="lp-fake-name" />
                    <div className="lp-fake-content" />
                    <div className="lp-fake-content lp-fc-short" />
                    <div className="lp-fake-chips">
                      <span className="lp-fake-chip">#nodejs</span>
                      <span className="lp-fake-chip">#webdev</span>
                    </div>
                    <div className="lp-fake-actions">
                      <span><Heart size={11} /> {12+i*7}</span>
                      <span><MessageCircle size={11} /> {3+i}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <a href="#features" className="lp-scroll-hint"><ChevronDown size={22} /></a>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section id="features" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-reveal">Everything you need</div>
          <h2 className="lp-section-title lp-reveal">Packed with powerful features</h2>
          <p className="lp-section-sub lp-reveal">Built to production standards with clean, modular architecture.</p>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="lp-feature-card lp-reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="lp-feature-icon"><f.icon size={22} /></div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEO ──────────────────────────────────── */}
      <section id="demo" className="lp-section lp-section-dark">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-reveal">See it in action</div>
          <h2 className="lp-section-title lp-reveal">Live Demo &amp; Walkthrough</h2>
          <p className="lp-section-sub lp-reveal">Watch a full walkthrough of the application features and user flows.</p>

          <div className="lp-video-wrapper lp-reveal">
            <div className="lp-video-container">
              {/* Replace src with your actual video URL */}
              <video
                ref={videoRef}
                className="lp-video"
                controls
                poster=""
                preload="metadata"
              >
                {/* Swap this src with your demo video path, e.g. /demo.mp4 */}
                <source src="/demo.mp4" type="video/mp4" />
                <p className="lp-video-fallback">
                  Your browser doesn't support video.
                  <a href="/demo.mp4" download>Download the demo</a>
                </p>
              </video>
              <div className="lp-video-placeholder">
                <div className="lp-play-ring">
                  <Play size={32} fill="currentColor" />
                </div>
                <p>Demo video coming soon</p>
                <span>Place your demo video at <code>public/demo.mp4</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ────────────────────────────────────────── */}
      <section id="team" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-reveal">The builders</div>
          <h2 className="lp-section-title lp-reveal">Meet the Developer{TEAM.length > 1 ? 's' : ''}</h2>
          <p className="lp-section-sub lp-reveal">Crafted with ❤️ as a full‑stack capstone project.</p>
          <div className="lp-team-grid">
            {TEAM.map((member, i) => (
              <div key={member.name} className="lp-team-card lp-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-team-avatar-ring">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}`}
                    alt={member.name}
                    className="lp-team-avatar"
                  />
                </div>
                <h3 className="lp-team-name">{member.name}</h3>
                <span className="lp-team-role">{member.role}</span>
                <p className="lp-team-desc">{member.desc}</p>
                <div className="lp-team-links">
                  <a href={member.github}   className="lp-team-link" target="_blank" rel="noreferrer"><Github    size={16} /></a>
                  <a href={member.linkedin} className="lp-team-link" target="_blank" rel="noreferrer"><Linkedin  size={16} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPORT ──────────────────────────────────────── */}
      <section id="report" className="lp-section lp-section-dark">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-reveal">Documentation</div>
          <h2 className="lp-section-title lp-reveal">Project Report</h2>
          <p className="lp-section-sub lp-reveal">Full technical report covering architecture, database design, API documentation and references.</p>

          <div className="lp-report-wrapper lp-reveal">
            {/* Replace the src with your actual PDF URL */}
            <div className="lp-pdf-frame-wrapper">
              <iframe
                className="lp-pdf-frame"
                src="/report.pdf"
                title="StoryStream Project Report"
              />
              <div className="lp-pdf-placeholder">
                <FileText size={48} />
                <p>Project Report Preview</p>
                <span>Place your PDF at <code>public/report.pdf</code> to enable the viewer</span>
                <a href="/report.pdf" download className="lp-btn-primary" style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} /> Download Report
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-stats-grid">
            {[
              { num: '9+',  label: 'API Endpoints' },
              { num: '3NF', label: 'DB Normalization' },
              { num: '100%', label: 'Raw SQL — No ORM' },
              { num: '∞',    label: 'Scalability' },
            ].map(s => (
              <div key={s.label} className="lp-stat-item lp-reveal">
                <div className="lp-stat-num">{s.num}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="lp-cta-section lp-reveal">
        <div className="lp-cta-glow" />
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to start streaming?</h2>
          <p className="lp-cta-sub">Join StoryStream and share your story with the world.</p>
          <button className="lp-btn-primary lp-btn-xl" onClick={handleGetStarted}>
            {user ? 'Go to Feed' : 'Create your account'} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand"><Sparkles size={18} /> StoryStream</div>
          <p className="lp-footer-copy">Built with ❤️ for DTU · Full‑Stack Capstone Project · MIT License</p>
          <div className="lp-footer-links">
            <a href="https://github.com" target="_blank" rel="noreferrer"><Github size={18} /></a>
            <a href="#"><Globe size={18} /></a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
