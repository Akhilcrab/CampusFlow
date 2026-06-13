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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
