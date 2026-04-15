import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="toggle-track">
        {/* Stars */}
        <span className="tt-star tt-s1" />
        <span className="tt-star tt-s2" />
        <span className="tt-star tt-s3" />
        <span className="tt-star tt-s4" />

        {/* Purple night mist at bottom */}
        <div className="tt-mist" />

        {/* Cloud shape */}
        <div className="tt-cloud-wrap">
          <svg className="tt-cloud-svg" viewBox="0 0 52 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="22" cy="24" rx="20" ry="10" fill="white" />
            <circle  cx="14" cy="20" r="9"            fill="white" />
            <circle  cx="24" cy="14" r="12"           fill="white" />
            <circle  cx="34" cy="20" r="8"            fill="white" />
            <ellipse cx="38" cy="25" rx="14" ry="9"   fill="white" />
          </svg>
        </div>

        {/* Knob */}
        <div className="toggle-knob">
          <div className="knob-icon-wrapper">
            <div className="moon-icon">
              <svg viewBox="0 0 28 28" width="22" height="22">
                <circle cx="14" cy="14" r="12" fill="rgba(180,130,255,0.18)" />
                <circle cx="14" cy="14" r="10" fill="#d8d0b8" />
                <circle cx="19" cy="10" r="9.5" fill="#1a0835" />
                <circle cx="14" cy="14" r="10" fill="none"
                  stroke="rgba(200,160,255,0.5)" strokeWidth="0.8" />
              </svg>
            </div>
            
            <div className="sun-icon">
              <svg viewBox="0 0 28 28" width="24" height="24">
                {[0,45,90,135,180,225,270,315].map((deg, i) => (
                  <line key={i}
                    x1="14" y1="4" x2="14" y2="1"
                    stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
                    transform={`rotate(${deg} 14 14)`}
                  />
                ))}
                <circle cx="14" cy="14" r="7"   fill="#fde68a" />
                <circle cx="14" cy="14" r="5"   fill="#fbbf24" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
