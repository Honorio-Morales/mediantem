/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    negro: '#1A1A2E',
                    azul: '#16213E',
                    rojo: '#E94560',
                    'rojo-dark': '#c73550',
                    gris: '#F0F0F0',
                },
            },
            fontFamily: {
                display: ['Montserrat', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
