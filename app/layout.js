export const metadata = {
  title: 'Alight AI - یارمەتیدەری زیرەکی',
  description: 'یارمەتیدەری AI بۆ Alight Motion',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ku" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
