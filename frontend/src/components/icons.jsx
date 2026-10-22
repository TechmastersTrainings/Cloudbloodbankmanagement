import React from 'react';

/**
 * Stroke-based icon set (no emoji), inheriting `currentColor`.
 * Usage: <IconDroplet /> or <IconUsers size={20} />
 */
const base = (props) => ({
  width: props.size || 18,
  height: props.size || 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: props.strokeWidth || 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': props['aria-label'] ? undefined : true,
  role: props['aria-label'] ? 'img' : undefined,
  'aria-label': props['aria-label'],
  className: props.className,
  style: props.style,
});

const make = (paths) => {
  const Icon = (props) => <svg {...base(props)}>{paths}</svg>;
  return Icon;
};

export const IconDroplet = make(
  <path d="M12 2.7s6.5 6.1 6.5 11a6.5 6.5 0 0 1-13 0c0-4.9 6.5-11 6.5-11Z" />
);
export const IconHome = make(
  <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></>
);
export const IconSearch = make(
  <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>
);
export const IconHospital = make(
  <><path d="M4 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15" /><path d="M16 10h2a2 2 0 0 1 2 2v9" /><path d="M2 21h20" /><path d="M10 7v4M8 9h4" /><path d="M9 21v-4h2v4" /></>
);
export const IconUsers = make(
  <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16.5 5.3a3 3 0 0 1 0 5.4" /><path d="M18 20a6 6 0 0 0-2.5-4.9" /></>
);
export const IconUser = make(
  <><circle cx="12" cy="8" r="3.6" /><path d="M5 21a7 7 0 0 1 14 0" /></>
);
export const IconCalendar = make(
  <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>
);
export const IconClipboard = make(
  <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /><path d="M9 11h6M9 15h4" /></>
);
export const IconChart = make(
  <><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="10" width="3" height="7" /></>
);
export const IconTrending = make(
  <><path d="M3 17l5-5 3.5 3.5L21 6" /><path d="M15 6h6v6" /></>
);
export const IconActivity = make(
  <path d="M3 12h4l2.5-7 4 14 2.5-7H21" />
);
export const IconCheck = make(<path d="M5 13l4 4L19 7" />);
export const IconCheckCircle = make(
  <><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.4 2.4 4.6-5" /></>
);
export const IconX = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconXCircle = make(
  <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>
);
export const IconAlert = make(
  <><path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>
);
export const IconInfo = make(
  <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>
);
export const IconBell = make(
  <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>
);
export const IconLogout = make(
  <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5" /><path d="M15 12H5" /></>
);
export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconEdit = make(
  <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14.5 7.5 2 2" /></>
);
export const IconTrash = make(
  <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6M14 11v6" /></>
);
export const IconArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconArrowLeft = make(<path d="M19 12H5M11 18l-6-6 6-6" />);
export const IconMapPin = make(
  <><path d="M12 21s7-5.7 7-11a7 7 0 0 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>
);
export const IconPhone = make(
  <path d="M4 5a2 2 0 0 1 2-2h2l1.5 4-2 1.4a12 12 0 0 0 5.1 5.1l1.4-2 4 1.5v2a2 2 0 0 1-2 2A15 15 0 0 1 4 5Z" />
);
export const IconMail = make(
  <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>
);
export const IconClock = make(
  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
);
export const IconShield = make(
  <><path d="M12 3l7 3v6c0 4.5-3 7.9-7 9-4-1.1-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>
);
export const IconHeart = make(
  <path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.6 12 20 12 20Z" />
);
export const IconChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const IconChevronRight = make(<path d="m9 6 6 6-6 6" />);
export const IconChevronLeft = make(<path d="m15 6-6 6 6 6" />);
export const IconFilter = make(<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />);
export const IconDownload = make(
  <><path d="M12 4v10" /><path d="m8 11 4 4 4-4" /><path d="M5 20h14" /></>
);
export const IconEye = make(
  <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.7" /></>
);
export const IconEyeOff = make(
  <><path d="M4 4l16 16" /><path d="M9.5 5.9A9.6 9.6 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-2.8 3.6" /><path d="M6.4 7.6A16.9 16.9 0 0 0 2 12s3.6 6.5 10 6.5c1.2 0 2.3-.2 3.3-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>
);
export const IconSettings = make(
  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.7 13.5H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7L4.6 7a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.7V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3Z" /></>
);
export const IconLock = make(
  <><rect x="4.5" y="10" width="15" height="10" rx="2" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></>
);
export const IconGlobe = make(
  <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></>
);
export const IconBox = make(
  <><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" /><path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" /></>
);
export const IconGrid = make(
  <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>
);
export const IconRefresh = make(
  <><path d="M20 11a8 8 0 0 0-14-4.5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14 4.5L20 16" /><path d="M20 20v-4h-4" /></>
);
export const IconExternal = make(
  <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>
);
export const IconCircleCheck = IconCheckCircle;
