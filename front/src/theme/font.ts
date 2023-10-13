import { Rubik } from 'next/font/google';

const font = Rubik({
	subsets: ['latin'],
	preload: true,
	display: 'swap',
	fallback: ["Rubik", 'Helvetica', 'Arial', 'sans-serif'],
});

export default font;
