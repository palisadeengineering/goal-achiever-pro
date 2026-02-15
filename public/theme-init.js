// Theme initialization script — runs before React hydrates to prevent flash of wrong theme.
// Loaded as an external script to avoid CSP 'unsafe-inline' for script-src.
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var isDark = theme === 'dark' ||
      (theme === 'system' || !theme) && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {}
})();
