import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Lora,
  Cormorant_Garamond,
  Fraunces,
  Space_Grotesk,
  Archivo,
  DM_Serif_Display,
  Manrope,
  Libre_Baskerville,
  Syne,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

// Additional premium pairings. These are not preloaded — only one theme renders
// per tenant page, so preloading all of them would waste bandwidth. The browser
// fetches each face on demand when a glyph first uses it (FOUT via swap).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  preload: false,
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  preload: false,
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  preload: false,
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  preload: false,
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  preload: false,
});

const fontVariables = [
  inter.variable,
  playfair.variable,
  lora.variable,
  cormorant.variable,
  fraunces.variable,
  spaceGrotesk.variable,
  archivo.variable,
  dmSerif.variable,
  manrope.variable,
  libreBaskerville.variable,
  syne.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Template Factory",
  description: "Generated dynamically via Active Brand config",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
