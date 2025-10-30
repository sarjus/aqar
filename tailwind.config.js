/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Google's Official Color Palette
        google: {
          blue: {
            50: '#E8F0FE',
            100: '#D2E3FC',
            200: '#AECBFA',
            300: '#8AB4F8',
            400: '#669DF6',
            500: '#4285F4', // Main Google Blue
            600: '#1A73E8',
            700: '#1967D2',
            800: '#185ABC',
            900: '#174EA6',
          },
          red: {
            50: '#FCE8E6',
            100: '#FAD2CF',
            200: '#F6AEA9',
            300: '#F28B82',
            400: '#EE675C',
            500: '#EA4335', // Main Google Red
            600: '#D93025',
            700: '#C5221F',
            800: '#B31412',
            900: '#A50E0E',
          },
          yellow: {
            50: '#FEF7E0',
            100: '#FEEFC3',
            200: '#FDE293',
            300: '#FDD663',
            400: '#FCC934',
            500: '#FBBC04', // Main Google Yellow
            600: '#F9AB00',
            700: '#F29900',
            800: '#EA8600',
            900: '#E37400',
          },
          green: {
            50: '#E6F4EA',
            100: '#CEEAD6',
            200: '#A8DAB5',
            300: '#81C995',
            400: '#5BB974',
            500: '#34A853', // Main Google Green
            600: '#1E8E3E',
            700: '#188038',
            800: '#137333',
            900: '#0D652D',
          },
          gray: {
            50: '#F8F9FA',
            100: '#F1F3F4',
            200: '#E8EAED',
            300: '#DADCE0',
            400: '#BDC1C6',
            500: '#9AA0A6',
            600: '#80868B',
            700: '#5F6368',
            800: '#3C4043',
            900: '#202124',
          }
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        display: ['Google Sans', 'Roboto', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

