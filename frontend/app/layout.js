import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ConceptCraft AI",
  description: "AI Visual Learning Platform",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '13px'
          }
        }} />
      </body>
    </html>
  );
}
