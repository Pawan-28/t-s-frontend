/**
 * Minimal, hand-rolled stroke-icon set for the dashboard app shell
 * (Sidebar nav items, TopHeader controls). Deliberately not a new icon
 * library dependency - same "small inline SVG, sized via className,
 * currentColor stroke" convention DashboardShell's own mobile menu toggle
 * already used before this file existed. Every icon takes just className so
 * callers size/color them with Tailwind like any other element.
 */
export type IconProps = { className?: string };

function base(paths: React.ReactNode, className?: string) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className ?? "h-5 w-5"} aria-hidden="true">
      {paths}
    </svg>
  );
}

export const HomeIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045a1.125 1.125 0 0 1 1.59 0L21.75 12M4.5 9.75V19.5a1.5 1.5 0 0 0 1.5 1.5h3.75a.75.75 0 0 0 .75-.75V15a1.5 1.5 0 0 1 1.5-1.5h1.5A1.5 1.5 0 0 1 15 15v5.25c0 .414.336.75.75.75H19.5a1.5 1.5 0 0 0 1.5-1.5V9.75" />, className);

export const FileTextIcon = ({ className }: IconProps) =>
  base(<><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75h6M9 15.75h6M9 9.75h1.5M6 20.25h12a1.5 1.5 0 0 0 1.5-1.5V8.121a1.5 1.5 0 0 0-.44-1.06l-3.62-3.622a1.5 1.5 0 0 0-1.061-.439H6a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" /></>, className);

export const PlusCircleIcon = ({ className }: IconProps) =>
  base(<><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v7.5M8.25 12h7.5" /><path d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Z" /></>, className);

export const FolderTreeIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6.75a2.25 2.25 0 0 1 2.25-2.25h5.379a1.5 1.5 0 0 1 1.06.44l1.622 1.62a1.5 1.5 0 0 0 1.06.44h5.13a2.25 2.25 0 0 1 2.25 2.25v3.026" />, className);

export const ImageIcon = ({ className }: IconProps) =>
  base(<><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 6.5 11.5a2 2 0 0 1 2.83 0l3.5 3.5M13.5 14 15 12.5a2 2 0 0 1 2.83 0l3.42 3.42" /><rect x="2.25" y="3.75" width="19.5" height="16.5" rx="2" /><circle cx="8" cy="8.5" r="1.25" /></>, className);

export const ClipboardCheckIcon = ({ className }: IconProps) =>
  base(<><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l1.5 1.5L15 9.75M8.25 4.5h7.5a.75.75 0 0 1 .75.75v.75H7.5v-.75a.75.75 0 0 1 .75-.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5.25H6a1.5 1.5 0 0 0-1.5 1.5v12.75a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5h-1.5" /></>, className);

export const CalendarClockIcon = ({ className }: IconProps) =>
  base(<><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path strokeLinecap="round" d="M3 9h18M8 3v3M16 3v3" /><circle cx="15.5" cy="15.5" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.5 14v1.5l1 .75" /></>, className);

export const UsersIcon = ({ className }: IconProps) =>
  base(<><circle cx="9" cy="8.25" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 19.5a6 6 0 0 1 12 0M16.5 10.5a2.5 2.5 0 1 0 0-5M18 19.5a5 5 0 0 0-4-4.9" /></>, className);

export const UserIcon = ({ className }: IconProps) =>
  base(<><circle cx="12" cy="8.25" r="3.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.75 19.5a7.25 7.25 0 0 1 14.5 0" /></>, className);

export const BadgeCheckIcon = ({ className }: IconProps) =>
  base(<><path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 1.5 1.5 3.75-3.75" /><path d="M12 2.75c.7 1.2 2 2 3.4 1.9.4 1.4 1.4 2.5 2.7 3-.2 1.4.2 2.9 1.15 4-1 1.1-1.4 2.6-1.15 4-1.3.5-2.3 1.6-2.7 3-1.4-.1-2.7.7-3.4 1.9-.7-1.2-2-2-3.4-1.9-.4-1.4-1.4-2.5-2.7-3 .25-1.4-.15-2.9-1.15-4 1-1.1 1.4-2.6 1.15-4 1.3-.5 2.3-1.6 2.7-3 1.4.1 2.7-.7 3.4-1.9Z" /></>, className);

export const BarChartIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 20.25h16.5M6.75 20.25v-6M12 20.25V9.75M17.25 20.25V4.5" />, className);

export const MegaphoneIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M11.25 3.75 5.25 8.25H3a1.5 1.5 0 0 0-1.5 1.5v2.25a1.5 1.5 0 0 0 1.5 1.5h.75l.9 4.05a1.5 1.5 0 0 0 1.464 1.2H7.5a1.125 1.125 0 0 0 1.098-1.377L7.5 13.5m3.75 6-2.475-9.9m2.475 9.9L11.25 20.25 5.25 8.25m6 11.25 6 3.75V3.75l-6 4.5" />, className);

export const BellIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.85 23.85 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.26 24.26 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />, className);

export const SettingsIcon = ({ className }: IconProps) =>
  base(<><path d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.774.773c.39.39.44 1.002.12 1.45l-.527.738c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.807-.272-1.204-.107-.397.165-.71.505-.78.93l-.15.893a1.125 1.125 0 0 1-1.11.94h-1.093a1.125 1.125 0 0 1-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.141-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.807.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15a1.125 1.125 0 0 1-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893Z" /><circle cx="12" cy="12" r="2.75" /></>, className);

export const LogOutIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3H21" />, className);

export const SearchIcon = ({ className }: IconProps) =>
  base(<><circle cx="10.5" cy="10.5" r="6.75" /><path strokeLinecap="round" d="m19.5 19.5-4.35-4.35" /></>, className);

export const MenuIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />, className);

export const XIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />, className);

export const ChevronDownIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />, className);

export const TrendingUpIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l3.75 3.75 7.5-8.25M15 6.75h5.25V12" />, className);

export const InboxIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h4.5l1.5 3h4.5l1.5-3h4.5M3.75 9.75 5.4 4.65a1.5 1.5 0 0 1 1.424-1.02h10.352a1.5 1.5 0 0 1 1.424 1.02l1.65 5.1M3.75 9.75v8.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V9.75" />, className);

export const ExternalLinkIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M6.22 4.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 9 6.22 5.28a.75.75 0 0 1 0-1.06Z" />, className);

export const SparklesIcon = ({ className }: IconProps) =>
  base(<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 3.75 9 6 8.187 3.75 6 3l2.187-.75L9 0l.813 2.25L12 3l-2.187.75ZM18.25 8.25 17 11.5l-1.25-3.25L12.5 7l3.25-1.25L17 2.5l1.25 3.25L21.5 7l-3.25 1.25ZM9.813 15.75 9 18l-.813-2.25L6 15l2.187-.75L9 12l.813 2.25L12 15l-2.187.75Z" />, className);

export const CreditCardIcon = ({ className }: IconProps) =>
  base(<><rect x="2.25" y="5.25" width="19.5" height="13.5" rx="2" /><path strokeLinecap="round" d="M2.25 9.75h19.5M5.25 15h4.5" /></>, className);

export const KeyIcon = ({ className }: IconProps) =>
  base(<><circle cx="7" cy="15.5" r="3.25" /><path strokeLinecap="round" strokeLinejoin="round" d="m9.4 13.1 8.35-8.35M15 5.5l2.25 2.25M17.75 2.75 20 5" /></>, className);

export const ShieldIcon = ({ className }: IconProps) =>
  base(<><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.75l7.25 3.1v5.4c0 4.55-3.1 7.9-7.25 9.5-4.15-1.6-7.25-4.95-7.25-9.5v-5.4L12 2.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m9.25 12 2 2 3.5-4" /></>, className);

export const ICON_MAP = {
  home: HomeIcon,
  fileText: FileTextIcon,
  plusCircle: PlusCircleIcon,
  folderTree: FolderTreeIcon,
  image: ImageIcon,
  clipboardCheck: ClipboardCheckIcon,
  calendarClock: CalendarClockIcon,
  users: UsersIcon,
  user: UserIcon,
  badgeCheck: BadgeCheckIcon,
  barChart: BarChartIcon,
  megaphone: MegaphoneIcon,
  bell: BellIcon,
  settings: SettingsIcon,
  logOut: LogOutIcon,
  sparkles: SparklesIcon,
  creditCard: CreditCardIcon,
  key: KeyIcon,
  shield: ShieldIcon,
} as const;

export type IconName = keyof typeof ICON_MAP;
