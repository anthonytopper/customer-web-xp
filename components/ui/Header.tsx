import Link from "next/link";
import { auth0 } from "@/lib/auth/auth0";
import Image from "next/image";
import { NavigationContent } from "./NavigationContent";
import { UserDropdown } from "./UserDropdown";

export async function Header() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <header className="fixed z-10 w-full bg-white shadow-[0px_24px_12px_-24px_rgba(0,0,0,0.25)]">
      <nav className="mx-auto flex h-[80px] max-w-[1120px] items-center justify-between px-8">
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/rebind-logo.svg"
              alt="Rebind logo"
              width={157}
              height={30}
              className="h-[30px] w-[157px]"
              priority
            />
          </Link>
        </div>

        {user && (
          <div className="flex min-w-0 flex-1 justify-center">
            <NavigationContent />
          </div>
        )}

        {user ? (
          <div className="shrink-0">
            <UserDropdown userName={user.name} />
          </div>
        ) : (
          <div
            className="flex items-center gap-2 shrink-0"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            <Link
              href="/login"
              className="rounded-full border border-[#3C3D47] bg-white px-4 py-2.5 text-sm leading-[1.268] text-[#3C3D47] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:border-[#2E2F37]"
            >
              Sign In
            </Link>
            <Link
              href="/login?screen_hint=signup"
              className="rounded-full border border-[#3C3D47] bg-[#3C3D47] px-4 py-2.5 text-sm leading-[1.268] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#2E2F37]"
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

