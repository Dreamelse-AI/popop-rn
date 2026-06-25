import { cdnImage } from '@/shared/lib/cdn';
import { userAvatarPlaceholder as avatarPlaceholder } from '../user-avatar';

const iconChecked = cdnImage('assets/auth/checked.png');
const iconCheck = cdnImage('assets/auth/check.png');
const iconChevronRight = cdnImage('assets/auth/chevron-right.png');
const iconValidCircle = cdnImage('assets/auth/valid-circle.png');
const iconClose = cdnImage('assets/auth/icon-close.png');
const iconGlobe = cdnImage('assets/auth/icon-globe.png');
const iconRequiredMark = cdnImage('assets/auth/required-mark.png');

export const authAssets = {
  iconChecked,
  iconCheck,
  iconChevronRight,
  iconValidCircle,
  iconClose,
  iconGlobe,
  iconRequiredMark,
  avatarPlaceholder,
};
