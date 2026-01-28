'use client';

import { SectionTeaser } from '@/data/onboard/sections';
import Image from 'next/image';

interface OnboardRecastListProps {
  sectionManifests: SectionTeaser[];
  isBlurred?: boolean;
}

// Check circle icon for DONE tag
function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0ZM10.7071 5.29289C11.0976 5.68342 11.0976 6.31658 10.7071 6.70711L6.70711 10.7071C6.31658 11.0976 5.68342 11.0976 5.29289 10.7071L3.29289 8.70711C2.90237 8.31658 2.90237 7.68342 3.29289 7.29289C3.68342 6.90237 4.31658 6.90237 4.70711 7.29289L6 8.58579L9.29289 5.29289C9.68342 4.90237 10.3166 4.90237 10.7071 5.29289Z" fill="white"/>
    </svg>
  );
}

// Volume max icon for Listen button
function VolumeMaxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
      <path d="M11.5 3.5L6.5 7.5H3V10.5H6.5L11.5 14.5V3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M13.5 6C14.3284 6.82843 14.8284 7.82843 14.8284 9C14.8284 10.1716 14.3284 11.1716 13.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M15.5 4C17.1569 5.65685 18 7.82843 18 10C18 12.1716 17.1569 14.3431 15.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Align left icon for Read button
function AlignLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
      <path d="M3 3H15M3 7.5H12M3 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function OnboardRecastList({ sectionManifests, isBlurred }: OnboardRecastListProps) {
  return (
    <div className={`w-full max-w-4xl mx-auto px-4 py-8 ${isBlurred ? 'blur-xs' : ''}`}>
      <div className="grid grid-cols-2 gap-12 justify-items-center">
        {sectionManifests.map((sectionManifest) => (
          <div
            key={sectionManifest.id}
            className="relative overflow-hidden bg-white dark:bg-gray-800 shadow-md flex flex-col w-full max-w-[300px] p-4 rounded-lg"
          >
            {/* Image Section */}
            <div 
              className="relative w-full overflow-hidden"
              style={{ height: '160px', backgroundColor: '#5A7D56' }}
            >
              {/* Image overlapping container */}
              <div className="absolute left-0" style={{ width: '100%', height: '100%' }}>
                <Image
                  src={sectionManifest.default_image_url || '/recast-tile-image.svg'}
                  alt={sectionManifest.title}
                  width={208}
                  height={208}
                  className="object-cover w-full h-full"
                />
              </div>
              
              {/* DONE Tag Overlay */}
              <div 
                className="absolute flex items-center gap-1 px-1 py-0.5 rounded"
                style={{ 
                  right: '8px', 
                  top: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: '4px',
                }}
              >
                <CheckCircleIcon />
                <span className="text-white text-xs font-bold leading-tight" style={{ fontSize: '11px', lineHeight: '1.268em' }}>
                  DONE
                </span>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="flex flex-col justify-between pt-4" style={{ height: '136px', gap: '4px' }}>
              {/* Title Section */}
              <div className="flex flex-col gap-1">
                <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400" style={{ 
                  fontFamily: 'Lora, serif',
                  fontSize: '13px',
                  lineHeight: '1.28em',
                  color: '#70727C',
                }}>
                  Overline
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white" style={{
                  fontFamily: 'Libre Caslon Text, serif',
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: '#3C3D47',
                }}>
                  {sectionManifest.title}
                </h3>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 mt-auto">
                {/* Listen Button */}
                <button
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full border transition-colors"
                  style={{
                    borderRadius: '30px',
                    borderColor: '#3C3D47',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    fontSize: '14px',
                    lineHeight: '1.268em',
                    color: '#3C3D47',
                  }}
                >
                  <VolumeMaxIcon />
                  <span>Listen 12:22</span>
                </button>
                
                {/* Read Button */}
                <button
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full transition-colors"
                  style={{
                    borderRadius: '30px',
                    fontSize: '14px',
                    lineHeight: '1.268em',
                    color: '#3C3D47',
                  }}
                >
                  <AlignLeftIcon />
                  <span>Read</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
