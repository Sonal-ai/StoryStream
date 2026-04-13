import { useTheme } from '../context/ThemeContext';

/**
 * Animated dark/light toggle.
 * Dark mode → Moon with stars orbiting
 * Light mode → Sun peeking behind fluffy clouds
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
      <div className="toggle-track">
        {/* Stars (dark mode) */}
        <span className="star s1" />
        <span className="star s2" />
        <span className="star s3" />

        {/* Cloud (light mode) */}
        <div className="cloud">
          <span className="cloud-body" />
          <span className="cloud-bump1" />
          <span className="cloud-bump2" />
        </div>

        {/* The sliding knob: moon or sun */}
        <div className="toggle-knob">
          {isDark ? (
            /* Moon shape */
            <div className="moon-icon">
              <div className="moon-crescent" />
            </div>
          ) : (
            /* Sun shape */
            <div className="sun-icon">
              {[...Array(8)].map((_, i) => (
                <span key={i} className="sun-ray" style={{ transform: `rotate(${i * 45}deg)` }} />
              ))}
              <div className="sun-core" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
