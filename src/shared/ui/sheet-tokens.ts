/** Bottom Sheet 设计 token（标准参考：MusicPickerSheet） */
export const SHEET = {
  background: '#f7f7f7',
  radius: 30,
  backdrop: 'rgba(0,0,0,0.6)',
  header: {
    paddingH: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000000',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  content: {
    paddingH: 12,
    paddingBottom: 16,
    gap: 8,
  },
  row: {
    height: 56,
    radius: 20,
    bg: '#ffffff',
    paddingH: 16,
  },
  badge: {
    bg: '#fdeab3',
    textColor: 'rgba(0,0,0,0.7)',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  confirm: {
    height: 60,
    radius: 20,
    bg: '#000000',
    textColor: '#ffffff',
    fontSize: 18,
    fontWeight: '600' as const,
    disabledOpacity: 0.4,
  },
  close: {
    right: 15,
    top: 15,
    iconSize: 28,
  },
  footer: {
    paddingH: 12,
    paddingV: 12,
  },
  handle: {
    width: 40,
    height: 4,
    radius: 2,
    bg: 'rgba(0,0,0,0.1)',
    marginTop: 12,
    marginBottom: 4,
  },
  empty: {
    paddingV: 32,
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  retry: {
    bg: '#fdeab3',
    textColor: '#000000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
} as const
