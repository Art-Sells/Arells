import {ReactNode} from "react"

type LayoutProps = {
  children: ReactNode;
};
export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
