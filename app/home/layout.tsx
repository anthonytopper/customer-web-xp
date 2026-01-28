import { Header } from "@/components/ui/Header";
import HomeSubnav from "@/components/ui/HomeSubnav";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div className="pt-[88px]">
        <div className="mx-auto w-full max-w-[918px] px-6">
          <div className="py-4">
            <HomeSubnav />
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
