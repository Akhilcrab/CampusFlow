import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusFlow | AI-Powered Student Academic Inbox & Assistant',
  description: 'CampusFlow aggregates WhatsApp notifications, portal circulars, and screenshot alerts into a single academic feed with auto-generated reminders and smart desktop notifications.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
