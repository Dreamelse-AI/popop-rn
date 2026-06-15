import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

import type { CreationFormSection } from '../types/form';

const STICKY_NAV_OFFSET = 72;

export function useSectionScrollSpy(
  scrollRootRef: React.RefObject<ScrollView | null>,
  sections: CreationFormSection[],
) {
  const sectionOffsets = useRef<Partial<Record<CreationFormSection, number>>>({});
  const [activeSection, setActiveSection] = useState<CreationFormSection>(sections[0] ?? 'basic');
  const scrollingByClickRef = useRef(false);

  const setSectionOffset = useCallback(
    (key: CreationFormSection, offset: number) => {
      sectionOffsets.current[key] = offset;
    },
    [],
  );

  const scrollToSection = useCallback((key: CreationFormSection) => {
    const root = scrollRootRef.current;
    const offset = sectionOffsets.current[key];
    if (!root || offset === undefined) return;

    scrollingByClickRef.current = true;
    setActiveSection(key);

    const nextTop = Math.max(0, offset - STICKY_NAV_OFFSET);
    root.scrollTo({ y: nextTop, animated: true });

    setTimeout(() => {
      scrollingByClickRef.current = false;
    }, 480);
  }, [scrollRootRef]);

  const handleScroll = useCallback(
    (scrollY: number) => {
      if (scrollingByClickRef.current) return;

      let current: CreationFormSection = sections[0] ?? 'basic';
      for (const section of sections) {
        const offset = sectionOffsets.current[section];
        if (offset === undefined) continue;
        if (scrollY + STICKY_NAV_OFFSET >= offset) {
          current = section;
        }
      }
      setActiveSection(current);
    },
    [sections],
  );

  return { activeSection, setSectionOffset, scrollToSection, handleScroll };
}
