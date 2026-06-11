import type { LanguageBoost } from '@/lib/minimax/types';

export interface LanguageOption {
  value: LanguageBoost;
  label: string;
  nativeLabel: string;
  flag?: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'auto', label: '自动检测', nativeLabel: 'Auto Detect', flag: '🌐' },
  { value: 'Chinese', label: '中文（普通话）', nativeLabel: '中文', flag: '🇨🇳' },
  { value: 'Chinese,Yue', label: '粤语', nativeLabel: '粵語', flag: '🇭🇰' },
  { value: 'English', label: '英语', nativeLabel: 'English', flag: '🇬🇧' },
  { value: 'Japanese', label: '日语', nativeLabel: '日本語', flag: '🇯🇵' },
  { value: 'Korean', label: '韩语', nativeLabel: '한국어', flag: '🇰🇷' },
  { value: 'Spanish', label: '西班牙语', nativeLabel: 'Español', flag: '🇪🇸' },
  { value: 'French', label: '法语', nativeLabel: 'Français', flag: '🇫🇷' },
  { value: 'Portuguese', label: '葡萄牙语', nativeLabel: 'Português', flag: '🇵🇹' },
  { value: 'German', label: '德语', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { value: 'Russian', label: '俄语', nativeLabel: 'Русский', flag: '🇷🇺' },
  { value: 'Arabic', label: '阿拉伯语', nativeLabel: 'العربية', flag: '🇸🇦' },
  { value: 'Italian', label: '意大利语', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { value: 'Turkish', label: '土耳其语', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { value: 'Dutch', label: '荷兰语', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  { value: 'Ukrainian', label: '乌克兰语', nativeLabel: 'Українська', flag: '🇺🇦' },
  { value: 'Vietnamese', label: '越南语', nativeLabel: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'Indonesian', label: '印尼语', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'Thai', label: '泰语', nativeLabel: 'ภาษาไทย', flag: '🇹🇭' },
  { value: 'Polish', label: '波兰语', nativeLabel: 'Polski', flag: '🇵🇱' },
  { value: 'Romanian', label: '罗马尼亚语', nativeLabel: 'Română', flag: '🇷🇴' },
  { value: 'Greek', label: '希腊语', nativeLabel: 'Ελληνικά', flag: '🇬🇷' },
  { value: 'Czech', label: '捷克语', nativeLabel: 'Čeština', flag: '🇨🇿' },
  { value: 'Finnish', label: '芬兰语', nativeLabel: 'Suomi', flag: '🇫🇮' },
  { value: 'Hindi', label: '印地语', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
];
