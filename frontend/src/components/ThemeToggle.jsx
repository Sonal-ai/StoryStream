import { useTheme } from '../context/ThemeContext';

/**
 * Animated theme toggle:
 * DARK  → crescent moon on left + twinkling stars on right
 * LIGHT → golden sun knob slides RIGHT under a white cloud
 */
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
      <div className="tt-track">
        {/* ── Stars (right side, dark mode only) ── */}
        <span className="tt-star tt-s1" />
        <span className="tt-star tt-s2" />
        <span className="tt-star tt-s3" />
        <span className="tt-star tt-s4" />

        {/* ── Knob: moon (dark) / sun (light) ── */}
        <div className="tt-knob">
          {isDark ? (
            /* Crescent moon — cream circle with a dark cutout */
            <div className="tt-moon">
              <div className="tt-moon-cut" />
            </div>
          ) : (
            /* Sun — orange core + radiating rays */
            <div className="tt-sun">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="tt-ray" style={{ rotate: `${i * 45}deg` }} />
              ))}
              <div className="tt-sun-core" />
            </div>
          )}
        </div>

        {/* ── Cloud (right side, light mode only, layered ABOVE knob) ── */}
        <div className="tt-cloud">
          <div className="tt-cloud-bump1" />
          <div className="tt-cloud-bump2" />
          <div className="tt-cloud-body" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
