import type { CSSProperties } from 'react'
export type IconName = 'grid' | 'arrow' | 'building' | 'activity' | 'search' | 'sun' | 'moon' | 'pin' | 'chevron' | 'close' | 'bolt' | 'cooling' | 'water' | 'shield' | 'elevator' | 'check' | 'list' | 'globe' | 'reset' | 'menu' | 'sparkles'
const paths: Record<IconName,string> = {
  sparkles:'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z M20 2v4 M18 4h4',
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  arrow:'M5 12h14 M13 6l6 6-6 6',
  building:'M5 21V3h14v18 M3 21h18 M9 7h1 M14 7h1 M9 11h1 M14 11h1 M9 15h1 M14 15h1 M10 21v-3h4v3',
  activity:'M3 12h4l3-8 4 16 3-8h4',
  search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5',
  moon:'M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z',
  pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  chevron:'M6 9l6 6 6-6',close:'M6 6l12 12 M6 18L18 6',
  bolt:'M13 2 4 14h7l-1 8 10-13h-7l1-7Z',
  cooling:'M12 2v20 M3.3 7l17.4 10 M3.3 17 20.7 7 M9 4l3 3 3-3 M9 20l3-3 3 3',
  water:'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Z M8 15a4 4 0 0 0 4 4',
  shield:'M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6l-9-4Z M8 12l3 3 5-6',
  elevator:'M4 2h16v20H4z M8 10l4-4 4 4 M8 14l4 4 4-4',
  check:'M5 12l4 4L19 6',list:'M9 5h12 M9 12h12 M9 19h12 M3 5h1 M3 12h1 M3 19h1',
  globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18',
  reset:'M3 10a9 9 0 1 1 2 8 M3 3v7h7',menu:'M4 6h16 M4 12h16 M4 18h16'
}
export default function Icon({name,size=18,style}:{name:IconName;size?:number;style?:CSSProperties}) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]}/></svg>
}
