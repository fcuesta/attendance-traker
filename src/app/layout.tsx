import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Tracker",
  description: "Track practice attendance for teams using Google Sheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 relative">
        <div className="mx-auto max-w-5xl p-4 md:p-8">{children}</div>
      </body>
    </html>
  );
}
