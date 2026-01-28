import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        
        <div className="flex items-center gap-20">
          <Image
            className="dark:invert"
            src="/logo.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
        </div>


        
      </main>
    </div>
  );
}
