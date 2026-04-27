import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutricionista Virtual | Master Ray Viloria",
  description: "Tu plan de alimentación personalizado antiinflamatorio — La Maestría de Vivir",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
