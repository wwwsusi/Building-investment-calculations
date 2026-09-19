import type { SVGProps } from 'react'
type Props=SVGProps<SVGSVGElement>&{size?:number}
const Icon=({children,size=20,...p}:Props)=><svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
const make=(d:string)=>(p:Props)=><Icon {...p}><path d={d}/></Icon>
export const ArrowRight=make('M5 12h14m-6-6 6 6-6 6')
export const BarChart3=make('M4 20V10m6 10V4m6 16v-7m4 7H2')
export const Check=make('m5 12 4 4L19 6')
export const ChevronDown=make('m6 9 6 6 6-6')
export const CircleAlert=(p:Props)=><Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/></Icon>
export const Download=make('M12 3v12m-4-4 4 4 4-4M5 20h14')
export const Upload=make('M12 16V4m-4 4 4-4 4 4M5 20h14')
export const Flame=make('M12 22c4 0 7-3 7-7 0-3-2-6-5-10 0 3-2 4-3 5 0-3-1-5-1-7-3 3-5 7-5 11 0 5 3 8 7 8Z')
export const Gauge=(p:Props)=><Icon {...p}><path d="M4 18a8 8 0 1 1 16 0M12 13l4-4"/><circle cx="12" cy="18" r="1"/></Icon>
export const Info=(p:Props)=><Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></Icon>
export const Landmark=make('m3 10 9-6 9 6M5 10v8m5-8v8m4-8v8m5-8v8M3 21h18')
export const Menu=make('M4 7h16M4 12h16M4 17h16')
export const Moon=make('M20 15a8 8 0 1 1-11-11 7 7 0 0 0 11 11Z')
export const Sun=(p:Props)=><Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Icon>
export const RefreshCcw=make('M20 11a8 8 0 1 0-2 6M20 4v7h-7')
export const Scale=make('M12 3v18M5 6h14M5 6 2 12h6L5 6Zm14 0-3 6h6l-3-6ZM8 21h8')
export const Settings2=make('M4 7h10m4 0h2M14 4v6M4 17h2m4 0h10M10 14v6')
export const ShieldCheck=make('M12 3 4 6v6c0 5 3 8 8 9 5-1 8-4 8-9V6l-8-3Zm-4 9 3 3 5-6')
export const WalletCards=make('M4 7h15a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13M16 12h5')
