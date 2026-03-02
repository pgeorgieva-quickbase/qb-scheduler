/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        qb: {
          blue: '#1A73E8',
          'blue-hover': '#1557B0',
          'blue-light': 'rgba(26, 115, 232, 0.08)',
          'blue-ring': 'rgba(26, 115, 232, 0.25)',
        },
        canvas: '#FAFBFC',
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#F4F5F7',
          active: '#EBECF0',
        },
        ink: {
          primary: '#172B4D',
          secondary: '#5E6C84',
          tertiary: '#97A0AF',
        },
        status: {
          new: '#0052CC',
          scheduled: '#00875A',
          'in-progress': '#FF991F',
          complete: '#97A0AF',
          critical: '#DE350B',
        },
        ai: {
          purple: '#8B5CF6',
          indigo: '#6366F1',
          blue: '#1FB6FF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      boxShadow: {
        popover: '0 4px 16px rgba(23, 43, 77, 0.12), 0 0 1px rgba(23, 43, 77, 0.15)',
        modal: '0 8px 32px rgba(23, 43, 77, 0.16), 0 0 1px rgba(23, 43, 77, 0.12)',
        toast: '0 4px 12px rgba(23, 43, 77, 0.15)',
        ai: '0 4px 15px rgba(99, 102, 241, 0.3)',
        'ai-hover': '0 6px 20px rgba(99, 102, 241, 0.4)',
        // Material Design elevation levels
        'md-1': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'md-2': '0 2px 6px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'md-3': '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        'md-4': '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        sm: '3px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      transitionTimingFunction: {
        'material': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
