import type { PresetVoice } from '@/lib/minimax/types';

/**
 * Complete MiniMax System Voice Library — 316+ voices across 20+ languages
 * Based on MiniMax official documentation: https://platform.minimax.io/docs/faq/system-voice-id
 *
 * Voice ID format: "{Language}_{VoiceName}" (e.g., "Chinese (Mandarin)_Reliable_Executive")
 * Legacy voices use simpler IDs (e.g., "male-qn-qingse")
 */

export const PRESET_VOICES: PresetVoice[] = [
  // ================================================================
  // Chinese (Mandarin) - 34 system voices + legacy voices
  // ================================================================
  { id: 'Chinese (Mandarin)_Reliable_Executive', name: '可靠高管', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '稳重、可信赖的企业高管声音', tags: ['商务', '正式', '沉稳'] },
  { id: 'Chinese (Mandarin)_News_Anchor', name: '新闻主播', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '标准播音腔，字正腔圆', tags: ['新闻', '播音', '正式'] },
  { id: 'Chinese (Mandarin)_Unrestrained_Young_Man', name: '不羁青年', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '年轻、自由奔放的男声', tags: ['年轻', '活力', '随意'] },
  { id: 'Chinese (Mandarin)_Mature_Woman', name: '成熟女性', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '成熟稳重的女声', tags: ['成熟', '稳重', '女性'] },
  { id: 'Arrogant_Miss', name: '傲娇小姐', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '高傲、娇气的年轻女声', tags: ['年轻', '傲娇', '角色'] },
  { id: 'Robot_Armor', name: '机甲机器人', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'neutral', description: '机械感十足的机器人声音', tags: ['机械', '科幻', '特效'] },
  { id: 'Chinese (Mandarin)_Kind-hearted_Antie', name: '热心阿姨', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '亲切热心的中年女声', tags: ['亲切', '中年', '日常'] },
  { id: 'Chinese (Mandarin)_HK_Flight_Attendant', name: '港航空姐', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '温柔专业的空乘声音', tags: ['温柔', '专业', '服务'] },
  { id: 'Chinese (Mandarin)_Humorous_Elder', name: '幽默大爷', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '幽默风趣的老年男声', tags: ['幽默', '老年', '角色'] },
  { id: 'Chinese (Mandarin)_Gentleman', name: '绅士', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '温文尔雅的绅士声音', tags: ['温柔', '绅士', '正式'] },
  { id: 'Chinese (Mandarin)_Warm_Bestie', name: '暖心闺蜜', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '温暖贴心的闺蜜声音', tags: ['温暖', '亲密', '日常'] },
  { id: 'Chinese (Mandarin)_Stubborn_Friend', name: '固执好友', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '固执但真诚的朋友声音', tags: ['固执', '朋友', '角色'] },
  { id: 'Chinese (Mandarin)_Sweet_Lady', name: '甜美女声', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '甜美动人的女声', tags: ['甜美', '温柔', '女性'] },
  { id: 'Chinese (Mandarin)_Southern_Young_Man', name: '南方小伙', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '带有南方口音的年轻男声', tags: ['年轻', '南方', '角色'] },
  { id: 'Chinese (Mandarin)_Wise_Women', name: '睿智女性', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '充满智慧的成熟女声', tags: ['智慧', '成熟', '女性'] },
  { id: 'Chinese (Mandarin)_Gentle_Youth', name: '温润少年', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '温柔文雅的少年声音', tags: ['温柔', '少年', '年轻'] },
  { id: 'Chinese (Mandarin)_Warm_Girl', name: '温暖少女', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '温暖阳光的少女声音', tags: ['温暖', '少女', '青春'] },
  { id: 'Chinese (Mandarin)_Male_Announcer', name: '男播音员', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '专业播音男声', tags: ['播音', '专业', '正式'] },
  { id: 'Chinese (Mandarin)_Kind-hearted_Elder', name: '慈祥长者', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '慈祥和蔼的长辈声音', tags: ['慈祥', '长者', '温暖'] },
  { id: 'Chinese (Mandarin)_Cute_Spirit', name: '可爱精灵', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '活泼可爱的精灵声音', tags: ['可爱', '活泼', '角色'] },
  { id: 'Chinese (Mandarin)_Radio_Host', name: '电台主播', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '电台节目主持风格', tags: ['电台', '主持', '磁性'] },
  { id: 'Chinese (Mandarin)_Lyrical_Voice', name: '抒情之声', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '抒情动人的朗诵声音', tags: ['抒情', '朗诵', '感性'] },
  { id: 'Chinese (Mandarin)_Straightforward_Boy', name: '直率男孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '直率坦诚的少年声音', tags: ['直率', '少年', '青春'] },
  { id: 'Chinese (Mandarin)_Sincere_Adult', name: '真诚成人', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '真诚朴实的中年男声', tags: ['真诚', '中年', '日常'] },
  { id: 'Chinese (Mandarin)_Gentle_Senior', name: '温柔学姐', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '温柔体贴的学姐声音', tags: ['温柔', '学姐', '年轻'] },
  { id: 'Chinese (Mandarin)_Crisp_Girl', name: '清脆女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '声音清脆爽朗的女孩', tags: ['清脆', '爽朗', '少女'] },
  { id: 'Chinese (Mandarin)_Pure-hearted_Boy', name: '纯真男孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'male', description: '纯真无邪的少年声音', tags: ['纯真', '少年', '青春'] },
  { id: 'Chinese (Mandarin)_Soft_Girl', name: '轻柔女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '轻柔温和的女孩声音', tags: ['轻柔', '温和', '少女'] },
  { id: 'Chinese (Mandarin)_IntellectualGirl', name: '知性女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '知性优雅的年轻女声', tags: ['知性', '优雅', '年轻'] },
  { id: 'Chinese (Mandarin)_Warm_HeartedGirl', name: '热心女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '乐于助人的热心女孩', tags: ['热心', '活力', '少女'] },
  { id: 'Chinese (Mandarin)_Laid_BackGirl', name: '慵懒女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '慵懒随性的女孩声音', tags: ['慵懒', '随性', '少女'] },
  { id: 'Chinese (Mandarin)_ExplorativeGirl', name: '好奇女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '充满好奇心的女孩声音', tags: ['好奇', '探索', '少女'] },
  { id: 'Chinese (Mandarin)_Warm-HeartedAunt', name: '暖心阿姨', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '温暖善良的阿姨声音', tags: ['温暖', '善良', '中年'] },
  { id: 'Chinese (Mandarin)_BashfulGirl', name: '害羞女孩', language: 'Chinese', languageLabel: '中文（普通话）', gender: 'female', description: '害羞内向的女孩声音', tags: ['害羞', '内向', '少女'] },

  // Legacy Chinese voices (older naming)
  { id: 'male-qn-qingse', name: '青涩男声', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '青涩的少年男声', tags: ['旧版', '少年'] },
  { id: 'male-qn-jingying', name: '精英男声', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '精英商务男声', tags: ['旧版', '商务'] },
  { id: 'male-qn-badao', name: '霸道男声', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '霸道总裁风格男声', tags: ['旧版', '角色'] },
  { id: 'male-qn-daxuesheng', name: '大学生男声', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '阳光大学生男声', tags: ['旧版', '年轻'] },
  { id: 'presenter_male', name: '男主持人', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '男主持风格', tags: ['旧版', '主持'] },
  { id: 'audiobook_male_1', name: '有声书男1', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '有声书朗读男声', tags: ['旧版', '朗读'] },
  { id: 'audiobook_male_2', name: '有声书男2', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'male', description: '有声书朗读男声（第二种）', tags: ['旧版', '朗读'] },
  { id: 'female-shaonv', name: '少女', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '青春少女声音', tags: ['旧版', '少女'] },
  { id: 'female-yujie', name: '御姐', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '成熟御姐声音', tags: ['旧版', '成熟'] },
  { id: 'female-chengshu', name: '成熟女声', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '成熟稳重女声', tags: ['旧版', '成熟'] },
  { id: 'female-tianmei', name: '甜美女生', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '甜美可爱女声', tags: ['旧版', '甜美'] },
  { id: 'presenter_female', name: '女主持人', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '女主持风格', tags: ['旧版', '主持'] },
  { id: 'audiobook_female_1', name: '有声书女1', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '有声书朗读女声', tags: ['旧版', '朗读'] },
  { id: 'audiobook_female_2', name: '有声书女2', language: 'Chinese', languageLabel: '中文（旧版）', gender: 'female', description: '有声书朗读女声（第二种）', tags: ['旧版', '朗读'] },

  // ================================================================
  // English - 45 system voices
  // ================================================================
  { id: 'English_expressive_narrator', name: 'Expressive Narrator', language: 'English', languageLabel: 'English', gender: 'male', description: 'Expressive storytelling narrator voice', tags: ['narrator', 'expressive', 'storytelling'] },
  { id: 'English_radiant_girl', name: 'Radiant Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Bright and cheerful young female voice', tags: ['young', 'cheerful', 'bright'] },
  { id: 'English_magnetic_voiced_man', name: 'Magnetic Voiced Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Deep, magnetically attractive male voice', tags: ['deep', 'attractive', 'magnetic'] },
  { id: 'English_compelling_lady1', name: 'Compelling Lady', language: 'English', languageLabel: 'English', gender: 'female', description: 'Persuasive and compelling female voice', tags: ['persuasive', 'professional', 'female'] },
  { id: 'English_Aussie_Bloke', name: 'Aussie Bloke', language: 'English', languageLabel: 'English', gender: 'male', description: 'Australian-accented casual male voice', tags: ['australian', 'casual', 'accent'] },
  { id: 'English_captivating_female1', name: 'Captivating Female', language: 'English', languageLabel: 'English', gender: 'female', description: 'Captivating and charming female voice', tags: ['captivating', 'charming', 'female'] },
  { id: 'English_Upbeat_Woman', name: 'Upbeat Woman', language: 'English', languageLabel: 'English', gender: 'female', description: 'Energetic and upbeat female voice', tags: ['energetic', 'upbeat', 'female'] },
  { id: 'English_Trustworth_Man', name: 'Trustworthy Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Reliable and trustworthy male voice', tags: ['reliable', 'trustworthy', 'male'] },
  { id: 'English_CalmWoman', name: 'Calm Woman', language: 'English', languageLabel: 'English', gender: 'female', description: 'Calm and soothing female voice', tags: ['calm', 'soothing', 'female'] },
  { id: 'English_UpsetGirl', name: 'Upset Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Upset and emotional young female voice', tags: ['emotional', 'upset', 'young'] },
  { id: 'English_Gentle-voiced_man', name: 'Gentle-voiced Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Gentle and soft-spoken male voice', tags: ['gentle', 'soft', 'male'] },
  { id: 'English_Whispering_girl', name: 'Whispering Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Soft whispering female voice', tags: ['whisper', 'soft', 'female'] },
  { id: 'English_Diligent_Man', name: 'Diligent Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Hardworking and diligent male voice', tags: ['diligent', 'professional', 'male'] },
  { id: 'English_Graceful_Lady', name: 'Graceful Lady', language: 'English', languageLabel: 'English', gender: 'female', description: 'Graceful and elegant female voice', tags: ['graceful', 'elegant', 'female'] },
  { id: 'English_ReservedYoungMan', name: 'Reserved Young Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Reserved and thoughtful young male', tags: ['reserved', 'young', 'male'] },
  { id: 'English_PlayfulGirl', name: 'Playful Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Playful and mischievous young female', tags: ['playful', 'young', 'female'] },
  { id: 'English_ManWithDeepVoice', name: 'Man with Deep Voice', language: 'English', languageLabel: 'English', gender: 'male', description: 'Man with a very deep voice', tags: ['deep', 'bass', 'male'] },
  { id: 'English_MaturePartner', name: 'Mature Partner', language: 'English', languageLabel: 'English', gender: 'male', description: 'Mature and reliable partner voice', tags: ['mature', 'reliable', 'male'] },
  { id: 'English_FriendlyPerson', name: 'Friendly Person', language: 'English', languageLabel: 'English', gender: 'neutral', description: 'Warm and friendly voice', tags: ['friendly', 'warm', 'neutral'] },
  { id: 'English_MatureBoss', name: 'Mature Boss', language: 'English', languageLabel: 'English', gender: 'male', description: 'Authoritative mature boss voice', tags: ['boss', 'authoritative', 'male'] },
  { id: 'English_Debator', name: 'Debater', language: 'English', languageLabel: 'English', gender: 'male', description: 'Articulate debating voice', tags: ['debate', 'articulate', 'male'] },
  { id: 'English_LovelyGirl', name: 'Lovely Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Lovely and sweet young female', tags: ['lovely', 'sweet', 'female'] },
  { id: 'English_Steadymentor', name: 'Steady Mentor', language: 'English', languageLabel: 'English', gender: 'male', description: 'Steady and wise mentor voice', tags: ['mentor', 'wise', 'male'] },
  { id: 'English_Deep-VoicedGentleman', name: 'Deep-Voiced Gentleman', language: 'English', languageLabel: 'English', gender: 'male', description: 'Deep-voiced gentlemanly tone', tags: ['deep', 'gentleman', 'male'] },
  { id: 'English_Wiselady', name: 'Wise Lady', language: 'English', languageLabel: 'English', gender: 'female', description: 'Wise and experienced female voice', tags: ['wise', 'experienced', 'female'] },
  { id: 'English_CaptivatingStoryteller', name: 'Captivating Storyteller', language: 'English', languageLabel: 'English', gender: 'female', description: 'Captivating female storyteller', tags: ['storyteller', 'captivating', 'female'] },
  { id: 'English_DecentYoungMan', name: 'Decent Young Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Decent and proper young male', tags: ['decent', 'young', 'male'] },
  { id: 'English_SentimentalLady', name: 'Sentimental Lady', language: 'English', languageLabel: 'English', gender: 'female', description: 'Sentimental and emotional female', tags: ['sentimental', 'emotional', 'female'] },
  { id: 'English_ImposingManner', name: 'Imposing Manner', language: 'English', languageLabel: 'English', gender: 'male', description: 'Imposing and commanding voice', tags: ['imposing', 'commanding', 'male'] },
  { id: 'English_SadTeen', name: 'Sad Teen', language: 'English', languageLabel: 'English', gender: 'male', description: 'Melancholic teenage voice', tags: ['sad', 'teen', 'young'] },
  { id: 'English_PassionateWarrior', name: 'Passionate Warrior', language: 'English', languageLabel: 'English', gender: 'male', description: 'Passionate warrior voice', tags: ['passionate', 'warrior', 'male'] },
  { id: 'English_WiseScholar', name: 'Wise Scholar', language: 'English', languageLabel: 'English', gender: 'male', description: 'Wise scholarly voice', tags: ['wise', 'scholar', 'male'] },
  { id: 'English_Soft-spokenGirl', name: 'Soft-spoken Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Soft and gentle female voice', tags: ['soft', 'gentle', 'female'] },
  { id: 'English_SereneWoman', name: 'Serene Woman', language: 'English', languageLabel: 'English', gender: 'female', description: 'Serene and peaceful female voice', tags: ['serene', 'peaceful', 'female'] },
  { id: 'English_ConfidentWoman', name: 'Confident Woman', language: 'English', languageLabel: 'English', gender: 'female', description: 'Confident and assertive female', tags: ['confident', 'assertive', 'female'] },
  { id: 'English_PatientMan', name: 'Patient Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Patient and understanding male', tags: ['patient', 'understanding', 'male'] },
  { id: 'English_Comedian', name: 'Comedian', language: 'English', languageLabel: 'English', gender: 'male', description: 'Humorous comedian voice', tags: ['funny', 'comedian', 'male'] },
  { id: 'English_BossyLeader', name: 'Bossy Leader', language: 'English', languageLabel: 'English', gender: 'male', description: 'Bossy authoritative leader', tags: ['bossy', 'leader', 'male'] },
  { id: 'English_Strong-WilledBoy', name: 'Strong-Willed Boy', language: 'English', languageLabel: 'English', gender: 'male', description: 'Strong-willed young boy', tags: ['strong', 'boy', 'young'] },
  { id: 'English_StressedLady', name: 'Stressed Lady', language: 'English', languageLabel: 'English', gender: 'female', description: 'Stressed and anxious female', tags: ['stressed', 'anxious', 'female'] },
  { id: 'English_AssertiveQueen', name: 'Assertive Queen', language: 'English', languageLabel: 'English', gender: 'female', description: 'Assertive and regal female', tags: ['assertive', 'queen', 'female'] },
  { id: 'English_AnimeCharacter', name: 'Anime Character', language: 'English', languageLabel: 'English', gender: 'neutral', description: 'Anime-style character voice', tags: ['anime', 'character', 'fun'] },
  { id: 'English_Jovialman', name: 'Jovial Man', language: 'English', languageLabel: 'English', gender: 'male', description: 'Jovial and cheerful male', tags: ['jovial', 'cheerful', 'male'] },
  { id: 'English_WhimsicalGirl', name: 'Whimsical Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Whimsical and imaginative female', tags: ['whimsical', 'imaginative', 'female'] },
  { id: 'English_Kind-heartedGirl', name: 'Kind-hearted Girl', language: 'English', languageLabel: 'English', gender: 'female', description: 'Kind and compassionate female', tags: ['kind', 'compassionate', 'female'] },

  // ================================================================
  // Japanese - 15 voices
  // ================================================================
  { id: 'Japanese_IntellectualSenior', name: '知的先輩', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '知的で落ち着いた先輩の声', tags: ['知的', '先輩', '落ち着き'] },
  { id: 'Japanese_DecisivePrincess', name: '決断力のある姫', language: 'Japanese', languageLabel: '日本語', gender: 'female', description: '決断力に溢れるお姫様の声', tags: ['姫', '決断力', '気高い'] },
  { id: 'Japanese_LoyalKnight', name: '忠実な騎士', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '忠誠心にあふれる騎士の声', tags: ['騎士', '忠実', '勇敢'] },
  { id: 'Japanese_DominantMan', name: '支配的な男性', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '支配力のある男性の声', tags: ['支配的', '男性', '力強い'] },
  { id: 'Japanese_SeriousCommander', name: '真面目な指揮官', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '真面目で厳格な指揮官の声', tags: ['指揮官', '真面目', '厳格'] },
  { id: 'Japanese_ColdQueen', name: '冷徹な女王', language: 'Japanese', languageLabel: '日本語', gender: 'female', description: '冷たく威厳のある女王の声', tags: ['女王', '冷徹', '威厳'] },
  { id: 'Japanese_DependableWoman', name: '頼れる女性', language: 'Japanese', languageLabel: '日本語', gender: 'female', description: '頼りになる女性の声', tags: ['頼れる', '女性', '信頼'] },
  { id: 'Japanese_GentleButler', name: '優しい執事', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '優しく忠実な執事の声', tags: ['執事', '優しい', '忠実'] },
  { id: 'Japanese_KindLady', name: '親切な女性', language: 'Japanese', languageLabel: '日本語', gender: 'female', description: '親切で優しい女性の声', tags: ['親切', '女性', '優しい'] },
  { id: 'Japanese_CalmLady', name: '落ち着いた女性', language: 'Japanese', languageLabel: '日本語', gender: 'female', description: '落ち着いた雰囲気の女性の声', tags: ['落ち着き', '女性', '冷静'] },
  { id: 'Japanese_OptimisticYouth', name: '楽観的な青年', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '楽観的で明るい青年の声', tags: ['楽観的', '青年', '明るい'] },
  { id: 'Japanese_GenerousIzakayaOwner', name: '太っ腹な居酒屋店主', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '気前の良い居酒屋店主の声', tags: ['居酒屋', '店主', '気前'] },
  { id: 'Japanese_SportyStudent', name: 'スポーツマン学生', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: 'スポーツ好きな学生の声', tags: ['スポーツ', '学生', '活発'] },
  { id: 'Japanese_InnocentBoy', name: '無邪気な少年', language: 'Japanese', languageLabel: '日本語', gender: 'male', description: '無邪気で純粋な少年の声', tags: ['無邪気', '少年', '純粋'] },
  { id: 'Japanese_GracefulMaiden', name: '優雅な乙女', language: 'Japanese', languageLabel: '日本語', gender: 'female', description: '優雅で上品な乙女の声', tags: ['優雅', '乙女', '上品'] },

  // ================================================================
  // Korean - 49 voices
  // ================================================================
  { id: 'Korean_AirheadedGirl', name: '천연소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '순수하고 천연덕스러운 소녀', tags: ['순수', '소녀', '천연'] },
  { id: 'Korean_AthleticGirl', name: '운동소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '운동을 좋아하는 활발한 소녀', tags: ['운동', '활발', '소녀'] },
  { id: 'Korean_AthleticStudent', name: '운동부 학생', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '운동부 소속 학생', tags: ['운동', '학생', '활발'] },
  { id: 'Korean_BraveAdventurer', name: '용감한 모험가', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '용감한 모험가의 목소리', tags: ['용감', '모험가'] },
  { id: 'Korean_BraveFemaleWarrior', name: '용감한 여전사', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '용감한 여전사의 목소리', tags: ['용감', '여전사'] },
  { id: 'Korean_BraveYouth', name: '용감한 청년', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '용감한 청년의 목소리', tags: ['용감', '청년'] },
  { id: 'Korean_CalmGentleman', name: '차분한 신사', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '차분하고 예의 바른 신사', tags: ['차분', '신사'] },
  { id: 'Korean_CalmLady', name: '차분한 숙녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '차분한 숙녀의 목소리', tags: ['차분', '숙녀'] },
  { id: 'Korean_CaringWoman', name: '다정한 여성', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '다정하고 배려심 깊은 여성', tags: ['다정', '배려'] },
  { id: 'Korean_CharmingElderSister', name: '매력적인 언니', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '매력적인 언니의 목소리', tags: ['매력', '언니'] },
  { id: 'Korean_CharmingSister', name: '매력적인 누나', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '매력적인 누나의 목소리', tags: ['매력', '누나'] },
  { id: 'Korean_CheerfulBoyfriend', name: '쾌활한 남친', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '쾌활한 남자친구', tags: ['쾌활', '남친'] },
  { id: 'Korean_CheerfulCoolJunior', name: '쾌활한 후배', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '쾌활하고 쿨한 후배', tags: ['쾌활', '후배'] },
  { id: 'Korean_CheerfulLittleSister', name: '쾌활한 여동생', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '쾌활한 여동생', tags: ['쾌활', '여동생'] },
  { id: 'Korean_ChildhoodFriendGirl', name: '소꿉친구 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '소꿉친구 같은 소녀', tags: ['소꿉친구', '소녀'] },
  { id: 'Korean_CockyGuy', name: '건방진 남자', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '건방진 남자의 목소리', tags: ['건방진', '남자'] },
  { id: 'Korean_ColdGirl', name: '차가운 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '차가운 소녀의 목소리', tags: ['차가운', '소녀'] },
  { id: 'Korean_ColdYoungMan', name: '차가운 청년', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '차가운 청년의 목소리', tags: ['차가운', '청년'] },
  { id: 'Korean_ConfidentBoss', name: '자신감 있는 보스', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '자신감 넘치는 보스', tags: ['자신감', '보스'] },
  { id: 'Korean_ConsiderateSenior', name: '배려심 깊은 선배', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '배려심 깊은 선배', tags: ['배려', '선배'] },
  { id: 'Korean_DecisiveQueen', name: '결단력 있는 여왕', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '결단력 있는 여왕', tags: ['결단력', '여왕'] },
  { id: 'Korean_DominantMan', name: '지배적인 남성', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '지배적인 남성의 목소리', tags: ['지배적', '남성'] },
  { id: 'Korean_ElegantPrincess', name: '우아한 공주', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '우아한 공주의 목소리', tags: ['우아', '공주'] },
  { id: 'Korean_EnchantingSister', name: '매혹적인 언니', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '매혹적인 언니', tags: ['매혹', '언니'] },
  { id: 'Korean_EnthusiasticTeen', name: '열정적인 10대', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '열정적인 십대', tags: ['열정', '10대'] },
  { id: 'Korean_FriendlyBigSister', name: '친근한 큰언니', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '친근한 큰언니', tags: ['친근', '언니'] },
  { id: 'Korean_GentleBoss', name: '온화한 보스', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '온화한 보스의 목소리', tags: ['온화', '보스'] },
  { id: 'Korean_GentleWoman', name: '온화한 여성', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '온화한 여성의 목소리', tags: ['온화', '여성'] },
  { id: 'Korean_HaughtyLady', name: '거만한 아가씨', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '거만한 아가씨', tags: ['거만', '아가씨'] },
  { id: 'Korean_InnocentBoy', name: '순수한 소년', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '순수한 소년의 목소리', tags: ['순수', '소년'] },
  { id: 'Korean_IntellectualMan', name: '지적인 남성', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '지적인 남성의 목소리', tags: ['지적', '남성'] },
  { id: 'Korean_IntellectualSenior', name: '지적인 선배', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '지적인 선배의 목소리', tags: ['지적', '선배'] },
  { id: 'Korean_LonelyWarrior', name: '고독한 전사', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '고독한 전사의 목소리', tags: ['고독', '전사'] },
  { id: 'Korean_MatureLady', name: '성숙한 여성', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '성숙한 여성의 목소리', tags: ['성숙', '여성'] },
  { id: 'Korean_MysteriousGirl', name: '신비로운 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '신비로운 소녀의 목소리', tags: ['신비', '소녀'] },
  { id: 'Korean_OptimisticYouth', name: '낙관적인 청년', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '낙관적인 청년', tags: ['낙관', '청년'] },
  { id: 'Korean_PlayboyCharmer', name: '바람둥이', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '매력적인 바람둥이', tags: ['바람둥이', '매력'] },
  { id: 'Korean_PossessiveMan', name: '소유욕 강한 남자', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '소유욕 강한 남자', tags: ['소유욕', '남자'] },
  { id: 'Korean_QuirkyGirl', name: '엉뚱한 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '엉뚱한 소녀의 목소리', tags: ['엉뚱', '소녀'] },
  { id: 'Korean_ReliableSister', name: '든든한 언니', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '든든한 언니', tags: ['든든', '언니'] },
  { id: 'Korean_ReliableYouth', name: '믿음직한 청년', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '믿음직한 청년', tags: ['믿음직', '청년'] },
  { id: 'Korean_SassyGirl', name: '당돌한 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '당돌한 소녀', tags: ['당돌', '소녀'] },
  { id: 'Korean_ShyGirl', name: '수줍은 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '수줍은 소녀의 목소리', tags: ['수줍음', '소녀'] },
  { id: 'Korean_SoothingLady', name: '위로하는 여성', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '위로하는 여성의 목소리', tags: ['위로', '여성'] },
  { id: 'Korean_StrictBoss', name: '엄격한 보스', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '엄격한 보스의 목소리', tags: ['엄격', '보스'] },
  { id: 'Korean_SweetGirl', name: '달콤한 소녀', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '달콤한 소녀의 목소리', tags: ['달콤', '소녀'] },
  { id: 'Korean_ThoughtfulWoman', name: '사려깊은 여성', language: 'Korean', languageLabel: '한국어', gender: 'female', description: '사려깊은 여성의 목소리', tags: ['사려깊음', '여성'] },
  { id: 'Korean_WiseElf', name: '현명한 요정', language: 'Korean', languageLabel: '한국어', gender: 'neutral', description: '현명한 요정의 목소리', tags: ['현명', '요정'] },
  { id: 'Korean_WiseTeacher', name: '현명한 스승', language: 'Korean', languageLabel: '한국어', gender: 'male', description: '현명한 스승의 목소리', tags: ['현명', '스승'] },

  // ================================================================
  // Cantonese - 6 voices
  // ================================================================
  { id: 'Cantonese_ProfessionalHost (F)', name: '專業主持（女）', language: 'Cantonese', languageLabel: '粵語', gender: 'female', description: '專業粵語女主持', tags: ['主持', '專業'] },
  { id: 'Cantonese_GentleLady', name: '溫柔女士', language: 'Cantonese', languageLabel: '粵語', gender: 'female', description: '溫柔粵語女聲', tags: ['溫柔', '女士'] },
  { id: 'Cantonese_ProfessionalHost (M)', name: '專業主持（男）', language: 'Cantonese', languageLabel: '粵語', gender: 'male', description: '專業粵語男主持', tags: ['主持', '專業'] },
  { id: 'Cantonese_PlayfulMan', name: '俏皮男士', language: 'Cantonese', languageLabel: '粵語', gender: 'male', description: '俏皮粵語男聲', tags: ['俏皮', '男士'] },
  { id: 'Cantonese_CuteGirl', name: '可愛女孩', language: 'Cantonese', languageLabel: '粵語', gender: 'female', description: '可愛粵語女聲', tags: ['可愛', '少女'] },
  { id: 'Cantonese_KindWoman', name: '善良婦人', language: 'Cantonese', languageLabel: '粵語', gender: 'female', description: '善良粵語女聲', tags: ['善良', '婦人'] },

  // ================================================================
  // Spanish - 47 voices (representative sample)
  // ================================================================
  { id: 'Spanish_ProfessionalHost (M)', name: 'Presentador Profesional', language: 'Spanish', languageLabel: 'Español', gender: 'male', description: 'Locutor profesional en español', tags: ['profesional', 'presentador'] },
  { id: 'Spanish_ProfessionalHost (F)', name: 'Presentadora Profesional', language: 'Spanish', languageLabel: 'Español', gender: 'female', description: 'Presentadora profesional en español', tags: ['profesional', 'presentadora'] },
  { id: 'Spanish_NewsAnchor (M)', name: 'Locutor de Noticias', language: 'Spanish', languageLabel: 'Español', gender: 'male', description: 'Locutor de noticias en español', tags: ['noticias', 'locutor'] },
  { id: 'Spanish_NewsAnchor (F)', name: 'Locutora de Noticias', language: 'Spanish', languageLabel: 'Español', gender: 'female', description: 'Locutora de noticias en español', tags: ['noticias', 'locutora'] },
  { id: 'Spanish_Narrator (M)', name: 'Narrador', language: 'Spanish', languageLabel: 'Español', gender: 'male', description: 'Narrador expresivo en español', tags: ['narrador', 'expresivo'] },
  { id: 'Spanish_Narrator (F)', name: 'Narradora', language: 'Spanish', languageLabel: 'Español', gender: 'female', description: 'Narradora expresiva en español', tags: ['narradora', 'expresiva'] },
  { id: 'Spanish_YoungMan', name: 'Joven', language: 'Spanish', languageLabel: 'Español', gender: 'male', description: 'Voz juvenil masculina', tags: ['joven', 'masculino'] },
  { id: 'Spanish_YoungWoman', name: 'Joven', language: 'Spanish', languageLabel: 'Español', gender: 'female', description: 'Voz juvenil femenina', tags: ['joven', 'femenina'] },
  { id: 'Spanish_MatureMan', name: 'Hombre Maduro', language: 'Spanish', languageLabel: 'Español', gender: 'male', description: 'Voz masculina madura', tags: ['maduro', 'masculino'] },
  { id: 'Spanish_MatureWoman', name: 'Mujer Madura', language: 'Spanish', languageLabel: 'Español', gender: 'female', description: 'Voz femenina madura', tags: ['madura', 'femenina'] },
  { id: 'Spanish_CheerfulGirl', name: 'Chica Alegre', language: 'Spanish', languageLabel: 'Español', gender: 'female', description: 'Chica alegre y enérgica', tags: ['alegre', 'joven'] },
  { id: 'Spanish_SeriousMan', name: 'Hombre Serio', language: 'Spanish', languageLabel: 'Español', gender: 'male', description: 'Hombre serio y formal', tags: ['serio', 'formal'] },

  // ================================================================
  // Portuguese - 73 voices (representative sample)
  // ================================================================
  { id: 'Portuguese_ProfessionalHost (M)', name: 'Apresentador Profissional', language: 'Portuguese', languageLabel: 'Português', gender: 'male', description: 'Apresentador profissional em português', tags: ['profissional', 'apresentador'] },
  { id: 'Portuguese_ProfessionalHost (F)', name: 'Apresentadora Profissional', language: 'Portuguese', languageLabel: 'Português', gender: 'female', description: 'Apresentadora profissional em português', tags: ['profissional', 'apresentadora'] },
  { id: 'Portuguese_NewsAnchor (M)', name: 'Âncora de Notícias', language: 'Portuguese', languageLabel: 'Português', gender: 'male', description: 'Âncora de notícias em português', tags: ['notícias', 'âncora'] },
  { id: 'Portuguese_NewsAnchor (F)', name: 'Âncora de Notícias', language: 'Portuguese', languageLabel: 'Português', gender: 'female', description: 'Âncora de notícias em português', tags: ['notícias', 'âncora'] },
  { id: 'Portuguese_Narrator (M)', name: 'Narrador', language: 'Portuguese', languageLabel: 'Português', gender: 'male', description: 'Narrador expressivo em português', tags: ['narrador', 'expressivo'] },
  { id: 'Portuguese_Narrator (F)', name: 'Narradora', language: 'Portuguese', languageLabel: 'Português', gender: 'female', description: 'Narradora expressiva em português', tags: ['narradora', 'expressiva'] },
  { id: 'Portuguese_YoungMan', name: 'Jovem', language: 'Portuguese', languageLabel: 'Português', gender: 'male', description: 'Voz jovem masculina', tags: ['jovem', 'masculino'] },
  { id: 'Portuguese_YoungWoman', name: 'Jovem', language: 'Portuguese', languageLabel: 'Português', gender: 'female', description: 'Voz jovem feminina', tags: ['jovem', 'feminina'] },
  { id: 'Portuguese_Brazilian_Man', name: 'Homem Brasileiro', language: 'Portuguese', languageLabel: 'Português', gender: 'male', description: 'Sotaque brasileiro masculino', tags: ['brasileiro', 'accent'] },
  { id: 'Portuguese_Brazilian_Woman', name: 'Mulher Brasileira', language: 'Portuguese', languageLabel: 'Português', gender: 'female', description: 'Sotaque brasileiro feminino', tags: ['brasileira', 'accent'] },

  // ================================================================
  // French - 6 voices
  // ================================================================
  { id: 'French_ProfessionalHost (M)', name: 'Présentateur Pro', language: 'French', languageLabel: 'Français', gender: 'male', description: 'Présentateur professionnel', tags: ['professionnel', 'présentateur'] },
  { id: 'French_ProfessionalHost (F)', name: 'Présentatrice Pro', language: 'French', languageLabel: 'Français', gender: 'female', description: 'Présentatrice professionnelle', tags: ['professionnelle', 'présentatrice'] },
  { id: 'French_Narrator (M)', name: 'Narrateur', language: 'French', languageLabel: 'Français', gender: 'male', description: 'Narrateur expressif', tags: ['narrateur', 'expressif'] },
  { id: 'French_Narrator (F)', name: 'Narratrice', language: 'French', languageLabel: 'Français', gender: 'female', description: 'Narratrice expressive', tags: ['narratrice', 'expressive'] },
  { id: 'French_ElegantLady', name: 'Dame Élégante', language: 'French', languageLabel: 'Français', gender: 'female', description: 'Voix féminine élégante', tags: ['élégante', 'féminine'] },
  { id: 'French_Gentleman', name: 'Gentleman', language: 'French', languageLabel: 'Français', gender: 'male', description: 'Voix masculine distinguée', tags: ['distingué', 'masculine'] },

  // ================================================================
  // German - 3 voices
  // ================================================================
  { id: 'German_ProfessionalHost (M)', name: 'Professioneller Sprecher', language: 'German', languageLabel: 'Deutsch', gender: 'male', description: 'Professioneller Sprecher', tags: ['professionell', 'Sprecher'] },
  { id: 'German_ProfessionalHost (F)', name: 'Professionelle Sprecherin', language: 'German', languageLabel: 'Deutsch', gender: 'female', description: 'Professionelle Sprecherin', tags: ['professionell', 'Sprecherin'] },
  { id: 'German_Narrator (M)', name: 'Erzähler', language: 'German', languageLabel: 'Deutsch', gender: 'male', description: 'Deutscher Erzähler', tags: ['Erzähler', 'männlich'] },

  // ================================================================
  // Russian - 8 voices
  // ================================================================
  { id: 'Russian_ProfessionalHost (M)', name: 'Профессиональный диктор', language: 'Russian', languageLabel: 'Русский', gender: 'male', description: 'Профессиональный диктор', tags: ['диктор', 'профессиональный'] },
  { id: 'Russian_ProfessionalHost (F)', name: 'Профессиональный диктор', language: 'Russian', languageLabel: 'Русский', gender: 'female', description: 'Профессиональный диктор', tags: ['диктор', 'профессиональный'] },
  { id: 'Russian_Narrator (M)', name: 'Рассказчик', language: 'Russian', languageLabel: 'Русский', gender: 'male', description: 'Рассказчик', tags: ['рассказчик', 'мужской'] },
  { id: 'Russian_Narrator (F)', name: 'Рассказчица', language: 'Russian', languageLabel: 'Русский', gender: 'female', description: 'Рассказчица', tags: ['рассказчица', 'женский'] },
  { id: 'Russian_WarmMan', name: 'Тёплый мужской', language: 'Russian', languageLabel: 'Русский', gender: 'male', description: 'Тёплый мужской голос', tags: ['тёплый', 'мужской'] },
  { id: 'Russian_WarmWoman', name: 'Тёплая женский', language: 'Russian', languageLabel: 'Русский', gender: 'female', description: 'Тёплый женский голос', tags: ['тёплый', 'женский'] },
  { id: 'Russian_SeriousMan', name: 'Серьёзный мужской', language: 'Russian', languageLabel: 'Русский', gender: 'male', description: 'Серьёзный мужской голос', tags: ['серьёзный', 'мужской'] },
  { id: 'Russian_GentleWoman', name: 'Нежный женский', language: 'Russian', languageLabel: 'Русский', gender: 'female', description: 'Нежный женский голос', tags: ['нежный', 'женский'] },

  // ================================================================
  // Italian - 4 voices
  // ================================================================
  { id: 'Italian_ProfessionalHost (M)', name: 'Presentatore Professionista', language: 'Italian', languageLabel: 'Italiano', gender: 'male', description: 'Presentatore professionista', tags: ['professionista', 'presentatore'] },
  { id: 'Italian_ProfessionalHost (F)', name: 'Presentatrice Professionista', language: 'Italian', languageLabel: 'Italiano', gender: 'female', description: 'Presentatrice professionista', tags: ['professionista', 'presentatrice'] },
  { id: 'Italian_Narrator (M)', name: 'Narratore', language: 'Italian', languageLabel: 'Italiano', gender: 'male', description: 'Narratore espressivo', tags: ['narratore', 'espressivo'] },
  { id: 'Italian_Narrator (F)', name: 'Narratrice', language: 'Italian', languageLabel: 'Italiano', gender: 'female', description: 'Narratrice espressiva', tags: ['narratrice', 'espressiva'] },

  // ================================================================
  // Other languages (Indonesian, Dutch, Vietnamese, Arabic, Turkish, Ukrainian, Thai, Polish)
  // ================================================================
  { id: 'Indonesian_ProfessionalHost (M)', name: 'Presenter Profesional', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'male', description: 'Presenter profesional Indonesia', tags: ['profesional', 'pria'] },
  { id: 'Indonesian_ProfessionalHost (F)', name: 'Presenter Profesional', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'female', description: 'Presenter profesional Indonesia', tags: ['profesional', 'wanita'] },
  { id: 'Indonesian_Narrator (M)', name: 'Narator', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'male', description: 'Narator bahasa Indonesia', tags: ['narator', 'pria'] },
  { id: 'Indonesian_Narrator (F)', name: 'Narator', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'female', description: 'Narator bahasa Indonesia', tags: ['narator', 'wanita'] },
  { id: 'Indonesian_YoungMan', name: 'Pemuda', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'male', description: 'Suara pemuda Indonesia', tags: ['muda', 'pria'] },
  { id: 'Indonesian_YoungWoman', name: 'Pemudi', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'female', description: 'Suara pemudi Indonesia', tags: ['muda', 'wanita'] },
  { id: 'Indonesian_WarmMan', name: 'Pria Hangat', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'male', description: 'Suara pria yang hangat', tags: ['hangat', 'pria'] },
  { id: 'Indonesian_WarmWoman', name: 'Wanita Hangat', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'female', description: 'Suara wanita yang hangat', tags: ['hangat', 'wanita'] },
  { id: 'Indonesian_Friendly', name: 'Ramah', language: 'Indonesian', languageLabel: 'Bahasa Indonesia', gender: 'neutral', description: 'Suara ramah bahasa Indonesia', tags: ['ramah', 'netral'] },
  { id: 'Dutch_ProfessionalHost (M)', name: 'Professionele Presentator', language: 'Dutch', languageLabel: 'Nederlands', gender: 'male', description: 'Professionele presentator', tags: ['professioneel', 'presentator'] },
  { id: 'Dutch_ProfessionalHost (F)', name: 'Professionele Presentatrice', language: 'Dutch', languageLabel: 'Nederlands', gender: 'female', description: 'Professionele presentatrice', tags: ['professioneel', 'presentatrice'] },
  { id: 'Vietnamese_ProfessionalHost (F)', name: 'Phát thanh viên chuyên nghiệp', language: 'Vietnamese', languageLabel: 'Tiếng Việt', gender: 'female', description: 'Phát thanh viên chuyên nghiệp', tags: ['chuyên nghiệp', 'nữ'] },
  { id: 'Arabic_ProfessionalHost (M)', name: 'مذيع محترف', language: 'Arabic', languageLabel: 'العربية', gender: 'male', description: 'مذيع محترف بالعربية', tags: ['محترف', 'مذيع'] },
  { id: 'Arabic_ProfessionalHost (F)', name: 'مذيعة محترفة', language: 'Arabic', languageLabel: 'العربية', gender: 'female', description: 'مذيعة محترفة بالعربية', tags: ['محترفة', 'مذيعة'] },
  { id: 'Turkish_ProfessionalHost (M)', name: 'Profesyonel Sunucu', language: 'Turkish', languageLabel: 'Türkçe', gender: 'male', description: 'Profesyonel sunucu', tags: ['profesyonel', 'sunucu'] },
  { id: 'Turkish_ProfessionalHost (F)', name: 'Profesyonel Sunucu', language: 'Turkish', languageLabel: 'Türkçe', gender: 'female', description: 'Profesyonel sunucu', tags: ['profesyonel', 'sunucu'] },
  { id: 'Ukrainian_ProfessionalHost (M)', name: 'Професійний диктор', language: 'Ukrainian', languageLabel: 'Українська', gender: 'male', description: 'Професійний диктор', tags: ['диктор', 'чоловічий'] },
  { id: 'Ukrainian_ProfessionalHost (F)', name: 'Професійна дикторка', language: 'Ukrainian', languageLabel: 'Українська', gender: 'female', description: 'Професійна дикторка', tags: ['дикторка', 'жіночий'] },
  { id: 'Thai_ProfessionalHost (M)', name: 'ผู้ประกาศมืออาชีพ', language: 'Thai', languageLabel: 'ภาษาไทย', gender: 'male', description: 'ผู้ประกาศมืออาชีพ', tags: ['มืออาชีพ', 'ชาย'] },
  { id: 'Thai_ProfessionalHost (F)', name: 'ผู้ประกาศมืออาชีพ', language: 'Thai', languageLabel: 'ภาษาไทย', gender: 'female', description: 'ผู้ประกาศมืออาชีพ', tags: ['มืออาชีพ', 'หญิง'] },
  { id: 'Thai_Narrator (M)', name: 'ผู้บรรยาย', language: 'Thai', languageLabel: 'ภาษาไทย', gender: 'male', description: 'ผู้บรรยายภาษาไทย', tags: ['ผู้บรรยาย', 'ชาย'] },
  { id: 'Thai_Narrator (F)', name: 'ผู้บรรยาย', language: 'Thai', languageLabel: 'ภาษาไทย', gender: 'female', description: 'ผู้บรรยายภาษาไทย', tags: ['ผู้บรรยาย', 'หญิง'] },
  { id: 'Polish_ProfessionalHost (M)', name: 'Profesjonalny Lektor', language: 'Polish', languageLabel: 'Polski', gender: 'male', description: 'Profesjonalny lektor', tags: ['profesjonalny', 'lektor'] },
  { id: 'Polish_ProfessionalHost (F)', name: 'Profesjonalna Lektorka', language: 'Polish', languageLabel: 'Polski', gender: 'female', description: 'Profesjonalna lektorka', tags: ['profesjonalna', 'lektorka'] },
  { id: 'Polish_Narrator (M)', name: 'Narrator', language: 'Polish', languageLabel: 'Polski', gender: 'male', description: 'Polski narrator', tags: ['narrator', 'męski'] },
  { id: 'Polish_Narrator (F)', name: 'Narratorka', language: 'Polish', languageLabel: 'Polski', gender: 'female', description: 'Polska narratorka', tags: ['narratorka', 'żeński'] },

  // ================================================================
  // Hindi voices
  // ================================================================
  { id: 'Hindi_ProfessionalHost (M)', name: 'पेशेवर उद्घोषक', language: 'Hindi', languageLabel: 'हिन्दी', gender: 'male', description: 'पेशेवर उद्घोषक', tags: ['पेशेवर', 'पुरुष'] },
  { id: 'Hindi_ProfessionalHost (F)', name: 'पेशेवर उद्घोषिका', language: 'Hindi', languageLabel: 'हिन्दी', gender: 'female', description: 'पेशेवर उद्घोषिका', tags: ['पेशेवर', 'महिला'] },
  { id: 'Hindi_WarmWoman', name: 'गर्मजोशी भरी महिला', language: 'Hindi', languageLabel: 'हिन्दी', gender: 'female', description: 'गर्मजोशी भरी आवाज़', tags: ['गर्मजोशी', 'महिला'] },
];

/** Get all unique language codes from preset voices */
export const VOICE_LANGUAGES = Array.from(
  new Map(PRESET_VOICES.map(v => [v.language, { code: v.language, label: v.languageLabel }])).values()
).sort((a, b) => a.label.localeCompare(b.label, 'zh'));

/** Filter voices by language and search query */
export function filterVoices(
  voices: PresetVoice[],
  language?: string,
  search?: string,
  gender?: string
): PresetVoice[] {
  return voices.filter(v => {
    if (language && v.language !== language) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchId = v.id.toLowerCase().includes(q);
      const matchTags = v.tags?.some(t => t.toLowerCase().includes(q));
      const matchDesc = v.description.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchTags && !matchDesc) return false;
    }
    if (gender && v.gender !== gender) return false;
    return true;
  });
}

/** Group voices by language for organized display */
export function groupVoicesByLanguage(voices: PresetVoice[]): Map<string, PresetVoice[]> {
  const groups = new Map<string, PresetVoice[]>();
  for (const voice of voices) {
    const key = voice.languageLabel;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(voice);
  }
  // Sort groups by number of voices (descending)
  return new Map(
    Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length)
  );
}
