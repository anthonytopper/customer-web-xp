import LoginCard from "@/components/auth/LoginCard";
import Testimonials from "@/components/ui/Testimonials";
import { getPlanBase } from "@/lib/api/bible";
import { DEFAULT_BASE_ID } from "@/lib/api/bible";
import Image from "next/image";
import { Suspense } from "react";

export default async function LoginPage() {
    const baseLayer = await getPlanBase(DEFAULT_BASE_ID);
    const imageUrl = baseLayer.sections[0].book_image_url;
    return (
        <div className="flex bg-slate-50 h-screen">
            <div className="w-1/3 bg-white flex flex-col justify-center">
                <div className="flex flex-col items-center justify-center">
                    <Image src="/logo.svg" alt="Rebind Logo" width={100} height={100} />
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginCard />
                </Suspense>
            </div>
            <div 
                className="flex-1 flex flex-col items-center justify-center bg-slate-50/50" 
                style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundBlendMode: "screen" }}
            >
                <Testimonials />
            </div>
        </div>
    );
}