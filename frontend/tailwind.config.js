/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'display': ['Outfit', 'sans-serif'],
                'sans': ['Inter', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#f8fafc',
                    100: '#e8eef7',
                    200: '#d0d8e6',
                    300: '#a8b1c9',
                    400: '#6f7a90',
                    500: '#111827',
                    600: '#0f1724',
                    700: '#0b0f18',
                    800: '#07090d',
                    900: '#030304',
                },
            },
        },
    },
    plugins: [],
}
