import { getShared, type SharedResponse } from "@/lib/api/shared";
import { ErrorBoundary } from "@/components/util/ErrorBoundary";
import SharedContent from "@/components/share/SharedContent";
import type { BibleBaseLayer, BibleBaseLayerSection } from "@/lib/plan/base";
import { getBaseLayerSectionByRef, getBibleTextForRef, getPlanBase } from "@/lib/api/bible";
import { DEFAULT_BASE_ID } from "@/lib/api/bible";
import * as BibRefUtils from "@/lib/toc/ref";
import type { Metadata } from "next";
import { BibleTOC } from "@/lib/toc/bible";
import * as PlanUtils from "@/lib/plan/util";
import Link from "next/link";
import GotoBookIcon from "@/components/icons/GotoBookIcon";
import { FaShare } from "react-icons/fa";
import { ShareButton } from "@/components/share/ShareButton";

interface SharePageProps {
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const sharedId = params.id;

  if (!sharedId) return {};

  try {
    const shared = await getShared(sharedId);
    const section = await getBaseLayerSectionByRef(DEFAULT_BASE_ID, shared.ref);
    const imageUrl = section?.book_image_url ?? section?.default_image_url;
    
    const fullRef = BibRefUtils.parseRefString(shared.ref);
    const prettyRef = BibRefUtils.prettyRefSimple(fullRef);
    const verseText = await getBibleTextForRef(fullRef);

    if (!imageUrl) return {};

    return {
      title: `Rebind - ${prettyRef}`,
      description: verseText,
      openGraph: {
        title: `Rebind - ${prettyRef}`,
        description: verseText,
        images: [imageUrl],
      },
      twitter: {
        card: "summary_large_image",
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const sharedId = params.id;

  if (!sharedId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
              Share Not Found
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Please provide a valid share ID in the query parameters.
            </p>
          </div>
        </main>
      </div>
    );
  }

  let shared: SharedResponse;
  let section: BibleBaseLayerSection | undefined;
  let verseText: string | undefined;
  let refStr: string | undefined;
  let refStrChapter: string | undefined;
  
  try {
    shared = await getShared(sharedId);
    section = await getBaseLayerSectionByRef(DEFAULT_BASE_ID, shared.ref);
    const baseLayer = await getPlanBase(DEFAULT_BASE_ID);
    const fullRef = BibRefUtils.parseRefString(shared.ref);
    verseText = await getBibleTextForRef(fullRef);
    const toc = PlanUtils.getTOCForBaseLayer(baseLayer);
    const refRange = BibRefUtils.parseRefString(shared.ref);
    refStr = toc?.prettyRefRange(refRange[0], refRange[1]) ?? shared.ref;
    refStrChapter = toc?.prettyRef(refRange[0]) ?? shared.ref;
  } catch (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
              Error Loading Share
            </h1>
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "Failed to load shared content"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="md:w-1/2 mx-auto pt-32 pb-16 flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <div className="text-3xl font-bold font-lora">
            {refStrChapter}
          </div>
          <div className="text-xl font-light font-lora opacity-50">
            American Standard Version
          </div>
        </div>
        <SharedContent 
          shared={shared} 
          backgroundImage={section?.book_image_url ?? section?.default_image_url} 
          verseText={verseText} 
          refStr={refStr}
        />
        <div className="flex justify-center gap-4 mt-8">
          <ShareButton shared={shared} refStr={refStr} verseText={verseText} />
          <Link
            href={`/reader?ref=${encodeURIComponent(shared.ref)}`}
            className="flex h-12 items-center justify-center gap-4 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium"
          >
            View in Book <GotoBookIcon />
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  );
}

