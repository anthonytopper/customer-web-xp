"use client";

import type { SharedResponse } from "@/lib/api/shared";
import * as BibRefUtils from "@/lib/toc/ref";
import { useMemo } from "react";
import { BibleTOC } from "@/lib/toc/bible";
import { BibleBaseLayer } from "@/lib/plan/base";
import * as PlanUtils from "@/lib/plan/util";
interface SharedContentProps {
  shared: SharedResponse;
  backgroundImage?: string;
  verseText?: string;
  refStr?: string;
}

export default function SharedContent({ shared, backgroundImage, verseText, refStr }: SharedContentProps) {
  return (
    <main className="flex w-full flex-col items-center justify-center">
      <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-md">
        {/* Background Image */}
        {backgroundImage && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-b dark:from-black from-transparent via-transparent to-white dark:to-black" />
        
        {/* Content Container */}
        <div className="relative h-full flex flex-col">
          {/* Top Right Button Area (for quote icon) */}
          <div className="absolute top-12 right-4 flex justify-end items-center w-[294px] h-5">
            {/* Quote icon button would go here */}
          </div>
          
          {/* Verse Text */}
          <div className="absolute top-[24px] left-4 w-full pr-12">
            <p
              className="dark:text-white text-[1.2rem] leading-8 font-normal"
              style={{ 
                fontFamily: "var(--font-lora), serif",
                textShadow: "0px 0px 16px #ffffff"
              }}
            >
              {verseText || refStr}
            </p>
          </div>
          
          {/* Reference */}
          <div className="absolute bottom-[58px] left-4 w-[248px]">
            <p
              className="dark:text-[#BBBEBB] text-gray-700 text-base leading-[1.5em] font-normal"
              style={{ 
                fontFamily: "var(--font-libre-caslon-text), serif",
                textShadow: "0px 0px 16px #ffffff"
              }}
            >
              {refStr}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

