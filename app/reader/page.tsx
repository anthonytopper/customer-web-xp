import Reader from "@/components/reader/Reader";
import { DEFAULT_BASE_ID, getPlanBase } from "@/lib/api/bible";
import { auth0 } from "@/lib/auth/auth0";
import { CFI } from "@/lib/cfi/helper";
import * as PlanUtils from "@/lib/plan/util";
import * as BibRefUtils from "@/lib/toc/ref";
import { redirect } from "next/navigation";

interface ReaderPageProps {
    searchParams: Promise<{ spine?: string, ref?: string }>;
}
export default async function ReaderPage({ searchParams }: ReaderPageProps) {
    const session = await auth0.getSession();
    const user = session?.user;
    const params = await searchParams;

    if (!user) {
        const paramsString = new URLSearchParams(params).toString();
        const returnTo = `/reader?${paramsString}`;
        return redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }

    const baseLayer = await getPlanBase(DEFAULT_BASE_ID);
    const toc = PlanUtils.getTOCForBaseLayer(baseLayer);

    const spine = params.spine;
    const ref = params.ref;
    let index = 1;
    if (spine) {
        index = parseInt(spine, 10);
    } else if (ref) {
        const refParsed = BibRefUtils.parseRefString(ref);
        const cfiStr = toc.getChapterCFI(refParsed[0]);
        const cfi = new CFI(cfiStr);
        index = cfi.spineIndex / 2 - 1;
    }

    const chapterRef = toc.getRefForChapterIndex(index) ?? undefined;
    const chapterRefStr = chapterRef ? baseLayer.sections.find(({ref}) => BibRefUtils.refsSameChapter(ref, chapterRef))?.ref ?? undefined : undefined;
    const prettyRef = toc.prettyRefForCFI(`epubcfi(/6/${(index + 1) * 2}!)`);

    return (
        <div className="container mx-auto h-content pt-[96px]">
            <div className="font-lora text-3xl font-bold ml-2">{prettyRef}</div>
            <Reader index={index} chapterRefStr={chapterRefStr} />
        </div>
    );
}