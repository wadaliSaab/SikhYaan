import "./globals.css";
import type { Metadata } from "next";
import { Roboto_Serif } from "next/font/google";
import SocketProvider from "@/providers/SocketProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { getloggedUser } from "@/src/utils/session";
import { getAuthUser } from "@/server/services/auth.service";


const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  variable: "--font-roboto-serif",
});

export const metadata: Metadata = {
  title: "SikhYaan - Sikh Gyaan and History",
  description: "Learn Sikh history, books, and more with SikhYaan",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getloggedUser();
  const user = session ? await getAuthUser(session.id) : null;

  return (
    <html lang="en" className={robotoSerif.variable}>
      <body>
        <AuthProvider user={user}>
          
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}