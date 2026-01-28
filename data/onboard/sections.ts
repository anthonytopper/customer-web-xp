import { SectionManifest } from "@/lib/plan/manifest";

export type SectionTeaser = Pick<SectionManifest, 'id' | 'title' | 'default_image_url'>

// Mock data - replace with actual data fetching logic
export const onboardTeaserSectionManifests: SectionTeaser[] = [
  {
    id: '1',
    title: 'Genesis 1:1-31',
    default_image_url: '/recast-1.jpg',
  },
  {
    id: '2',
    title: 'John 3:16',
    default_image_url: '/recast-1.jpg',
  },
  {
    id: '3',
    title: 'Psalm 23',
    default_image_url: '/recast-1.jpg',
  },
];
