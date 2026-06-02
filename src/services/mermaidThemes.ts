/**
 * Mermaid 主题变量配置
 *
 * 三套主题完整的 55 个 themeVariables 映射。
 * 从 mermaidRenderer.ts 中提取，减少主文件体积。
 */

/** Mermaid themeVariables 完整类型 */
export interface MermaidVars {
  primaryColor: string; primaryBorderColor: string; primaryTextColor: string
  secondaryColor: string; secondaryBorderColor: string; secondaryTextColor: string
  tertiaryColor: string; tertiaryBorderColor: string; tertiaryTextColor: string
  lineColor: string
  background: string; mainBkg: string; secondBkg: string
  nodeBorder: string; clusterBkg: string; clusterBorder: string
  titleColor: string; edgeLabelBackground: string
  darkMode: boolean; textColor: string; labelTextColor: string
  actorBorder: string; actorBkg: string; actorTextColor: string
  actorLineColor: string; signalColor: string; signalTextColor: string
  labelBoxBkgColor: string; labelBoxBorderColor: string
  activationBorderColor: string; activationBkgColor: string
  noteBkgColor: string; noteBorderColor: string
  noteTextColor: string; loopTextColor: string
  sectionBkgColor: string; sectionBkgColor2: string
  altSectionBkgColor: string; altSectionBkgColor2: string
  taskBkgColor: string; taskBorderColor: string; taskTextColor: string
  taskTextLightColor: string; taskTextDarkColor: string
  taskTextOutsideColor: string; taskTextClickableColor: string
  activeTaskBkgColor: string; activeTaskBorderColor: string
  doneTaskBkgColor: string; doneTaskBorderColor: string
  critBkgColor: string; critBorderColor: string
  todayLineColor: string; gridColor: string
  classText: string; entityBorder: string
  commitLabelColor: string; commitLabelBackground: string
  tagLabelColor: string; tagLabelBackground: string; tagLabelBorder: string
  pie1: string; pie2: string; pie3: string; pie4: string; pie5: string
  pie6: string; pie7: string; pie8: string; pie9: string; pie10: string
  pie11: string; pie12: string
  pieTitleTextColor: string; pieSectionTextColor: string; pieLegendTextColor: string
  pieStrokeColor: string
  labelColor: string; altBackground: string
}

// ====== 深色主题 ======
const darkVars: MermaidVars = {
  primaryColor:'#3B82F6', primaryBorderColor:'#60A5FA', primaryTextColor:'#FFFFFF',
  secondaryColor:'#1E293B', secondaryBorderColor:'#334155', secondaryTextColor:'#E5E7EB',
  tertiaryColor:'#1A2332', tertiaryBorderColor:'#2D3A4A', tertiaryTextColor:'#93C5FD',
  lineColor:'#475569', background:'#111827', mainBkg:'#111827', secondBkg:'#1A2332',
  nodeBorder:'#334155', clusterBkg:'#0F172A', clusterBorder:'#1E293B',
  titleColor:'#F1F5F9', edgeLabelBackground:'#1E293B',
  darkMode:true, textColor:'#E5E7EB', labelTextColor:'#b4bcc6',
  actorBorder:'#334155', actorBkg:'#1E293B', actorTextColor:'#E5E7EB',
  actorLineColor:'#475569', signalColor:'#E5E7EB', signalTextColor:'#E5E7EB',
  labelBoxBkgColor:'#1E293B', labelBoxBorderColor:'#334155',
  activationBorderColor:'#60A5FA', activationBkgColor:'#1E3A5F',
  noteBkgColor:'#1E293B', noteBorderColor:'#475569',
  noteTextColor:'#b4bcc6', loopTextColor:'#E5E7EB',
  sectionBkgColor:'#0F172A', sectionBkgColor2:'#1A2332',
  altSectionBkgColor:'#111827', altSectionBkgColor2:'#1E293B',
  taskBkgColor:'#3B82F6', taskBorderColor:'#60A5FA', taskTextColor:'#FFFFFF',
  taskTextLightColor:'#E5E7EB', taskTextDarkColor:'#1E293B',
  taskTextOutsideColor:'#b4bcc6', taskTextClickableColor:'#93C5FD',
  activeTaskBkgColor:'#1E293B', activeTaskBorderColor:'#475569',
  doneTaskBkgColor:'#374151', doneTaskBorderColor:'#4B5563',
  critBkgColor:'#7F1D1D', critBorderColor:'#F87171',
  todayLineColor:'#F59E0B', gridColor:'#1F2937',
  classText:'#E5E7EB', entityBorder:'#475569',
  commitLabelColor:'#E5E7EB', commitLabelBackground:'#1E293B',
  tagLabelColor:'#E5E7EB', tagLabelBackground:'#374151', tagLabelBorder:'#4B5563',
  pie1:'#3B82F6', pie2:'#8B5CF6', pie3:'#10B981', pie4:'#F59E0B',
  pie5:'#EF4444', pie6:'#EC4899', pie7:'#06B6D4', pie8:'#F97316',
  pie9:'#6366F1', pie10:'#14B8A6', pie11:'#E11D48', pie12:'#84CC16',
  pieTitleTextColor:'#E5E7EB', pieSectionTextColor:'#E5E7EB',
  pieLegendTextColor:'#D1D5DB', pieStrokeColor:'#111827',
  labelColor:'#E5E7EB', altBackground:'#1A2332',
}

// ====== 浅色主题 ======
const lightVars: MermaidVars = {
  primaryColor:'#2563EB', primaryBorderColor:'#3B82F6', primaryTextColor:'#FFFFFF',
  secondaryColor:'#F1F5F9', secondaryBorderColor:'#CBD5E1', secondaryTextColor:'#1E293B',
  tertiaryColor:'#E2E8F0', tertiaryBorderColor:'#94A3B8', tertiaryTextColor:'#2563EB',
  lineColor:'#CBD5E1', background:'#FFFFFF', mainBkg:'#FFFFFF', secondBkg:'#F8FAFC',
  nodeBorder:'#CBD5E1', clusterBkg:'#F1F5F9', clusterBorder:'#CBD5E1',
  titleColor:'#0F172A', edgeLabelBackground:'#F1F5F9',
  darkMode:false, textColor:'#0F172A', labelTextColor:'#546170',
  actorBorder:'#CBD5E1', actorBkg:'#F1F5F9', actorTextColor:'#1E293B',
  actorLineColor:'#758290', signalColor:'#1E293B', signalTextColor:'#1E293B',
  labelBoxBkgColor:'#F1F5F9', labelBoxBorderColor:'#CBD5E1',
  activationBorderColor:'#3B82F6', activationBkgColor:'#DBEAFE',
  noteBkgColor:'#FEFCE8', noteBorderColor:'#FDE047',
  noteTextColor:'#546170', loopTextColor:'#1E293B',
  sectionBkgColor:'#F1F5F9', sectionBkgColor2:'#E2E8F0',
  altSectionBkgColor:'#F8FAFC', altSectionBkgColor2:'#F1F5F9',
  taskBkgColor:'#2563EB', taskBorderColor:'#3B82F6', taskTextColor:'#FFFFFF',
  taskTextLightColor:'#F8FAFC', taskTextDarkColor:'#0F172A',
  taskTextOutsideColor:'#546170', taskTextClickableColor:'#2563EB',
  activeTaskBkgColor:'#F1F5F9', activeTaskBorderColor:'#94A3B8',
  doneTaskBkgColor:'#CBD5E1', doneTaskBorderColor:'#94A3B8',
  critBkgColor:'#FEE2E2', critBorderColor:'#FCA5A5',
  todayLineColor:'#F59E0B', gridColor:'#E2E8F0',
  classText:'#0F172A', entityBorder:'#CBD5E1',
  commitLabelColor:'#0F172A', commitLabelBackground:'#F1F5F9',
  tagLabelColor:'#0F172A', tagLabelBackground:'#CBD5E1', tagLabelBorder:'#94A3B8',
  pie1:'#2563EB', pie2:'#7C3AED', pie3:'#059669', pie4:'#D97706',
  pie5:'#DC2626', pie6:'#DB2777', pie7:'#0891B2', pie8:'#EA580C',
  pie9:'#4F46E5', pie10:'#0D9488', pie11:'#BE123C', pie12:'#65A30D',
  pieTitleTextColor:'#0F172A', pieSectionTextColor:'#0F172A',
  pieLegendTextColor:'#546170', pieStrokeColor:'#FFFFFF',
  labelColor:'#0F172A', altBackground:'#F8FAFC',
}

// ====== 护眼主题 ======
const sepiaVars: MermaidVars = {
  primaryColor:'#8B4513', primaryBorderColor:'#A0522D', primaryTextColor:'#FFFFFF',
  secondaryColor:'#EDE0C8', secondaryBorderColor:'#C4B998', secondaryTextColor:'#433422',
  tertiaryColor:'#D4C9A8', tertiaryBorderColor:'#A89878', tertiaryTextColor:'#6B3410',
  lineColor:'#8B7D6B', background:'#FBF6E8', mainBkg:'#FBF6E8', secondBkg:'#F4ECD8',
  nodeBorder:'#C4B998', clusterBkg:'#EDE0C8', clusterBorder:'#C4B998',
  titleColor:'#2C1E0E', edgeLabelBackground:'#EDE0C8',
  darkMode:false, textColor:'#2C1E0E', labelTextColor:'#5a4a3a',
  actorBorder:'#C4B998', actorBkg:'#EDE0C8', actorTextColor:'#433422',
  actorLineColor:'#6b5b48', signalColor:'#433422', signalTextColor:'#433422',
  labelBoxBkgColor:'#EDE0C8', labelBoxBorderColor:'#C4B998',
  activationBorderColor:'#A0522D', activationBkgColor:'#D4C9A8',
  noteBkgColor:'#F4ECD8', noteBorderColor:'#C4B998',
  noteTextColor:'#5a4a3a', loopTextColor:'#433422',
  sectionBkgColor:'#EDE0C8', sectionBkgColor2:'#D4C9A8',
  altSectionBkgColor:'#F4ECD8', altSectionBkgColor2:'#EDE0C8',
  taskBkgColor:'#8B4513', taskBorderColor:'#A0522D', taskTextColor:'#FFFFFF',
  taskTextLightColor:'#F4ECD8', taskTextDarkColor:'#2C1E0E',
  taskTextOutsideColor:'#5a4a3a', taskTextClickableColor:'#6B3410',
  activeTaskBkgColor:'#EDE0C8', activeTaskBorderColor:'#C4B998',
  doneTaskBkgColor:'#D4C9A8', doneTaskBorderColor:'#A89878',
  critBkgColor:'#F4E2D8', critBorderColor:'#C9A89A',
  todayLineColor:'#D4A400', gridColor:'#D4C9A8',
  classText:'#2C1E0E', entityBorder:'#C4B998',
  commitLabelColor:'#2C1E0E', commitLabelBackground:'#EDE0C8',
  tagLabelColor:'#433422', tagLabelBackground:'#D4C9A8', tagLabelBorder:'#A89878',
  pie1:'#8B4513', pie2:'#556B2F', pie3:'#2E7D32', pie4:'#C56E00',
  pie5:'#B71C1C', pie6:'#AD1457', pie7:'#00838F', pie8:'#E65100',
  pie9:'#5D4037', pie10:'#00695C', pie11:'#880E4F', pie12:'#558B2F',
  pieTitleTextColor:'#2C1E0E', pieSectionTextColor:'#2C1E0E',
  pieLegendTextColor:'#5a4a3a', pieStrokeColor:'#FBF6E8',
  labelColor:'#2C1E0E', altBackground:'#F4ECD8',
}

// ====== 霓虹主题 (Neon Abyss) ======
const neonVars: MermaidVars = {
  primaryColor: '#00f0ff', primaryBorderColor: '#33f3ff', primaryTextColor: '#0a0a0f',
  secondaryColor: '#111118', secondaryBorderColor: 'rgba(0,240,255,0.15)', secondaryTextColor: '#8888a0',
  tertiaryColor: '#1a1a24', tertiaryBorderColor: 'rgba(168,85,247,0.2)', tertiaryTextColor: '#00f0ff',
  lineColor: 'rgba(0,240,255,0.25)', background: '#0a0a0f', mainBkg: '#0a0a0f', secondBkg: '#111118',
  nodeBorder: 'rgba(0,240,255,0.2)', clusterBkg: '#0d0d14', clusterBorder: 'rgba(0,240,255,0.12)',
  titleColor: '#00f0ff', edgeLabelBackground: '#111118',
  darkMode: true, textColor: '#f0f0f5', labelTextColor: '#b0b0c0',
  actorBorder: 'rgba(255,0,229,0.3)', actorBkg: '#111118', actorTextColor: '#f0f0f5',
  actorLineColor: 'rgba(0,240,255,0.3)', signalColor: '#f0f0f5', signalTextColor: '#f0f0f5',
  labelBoxBkgColor: '#111118', labelBoxBorderColor: 'rgba(0,240,255,0.2)',
  activationBorderColor: '#00f0ff', activationBkgColor: 'rgba(0,240,255,0.08)',
  noteBkgColor: '#111118', noteBorderColor: 'rgba(255,184,0,0.3)',
  noteTextColor: '#b0b0c0', loopTextColor: '#f0f0f5',
  sectionBkgColor: '#0a0a0f', sectionBkgColor2: '#111118',
  altSectionBkgColor: '#0d0d14', altSectionBkgColor2: '#111118',
  taskBkgColor: '#00f0ff', taskBorderColor: '#33f3ff', taskTextColor: '#0a0a0f',
  taskTextLightColor: '#e8e8ed', taskTextDarkColor: '#0a0a0f',
  taskTextOutsideColor: '#808098', taskTextClickableColor: '#00f0ff',
  activeTaskBkgColor: '#111118', activeTaskBorderColor: 'rgba(0,240,255,0.35)',
  doneTaskBkgColor: '#1a1a24', doneTaskBorderColor: 'rgba(0,240,255,0.15)',
  critBkgColor: 'rgba(255,0,229,0.08)', critBorderColor: 'rgba(255,0,229,0.3)',
  todayLineColor: '#ffb800', gridColor: 'rgba(0,240,255,0.06)',
  classText: '#f0f0f5', entityBorder: 'rgba(0,240,255,0.2)',
  commitLabelColor: '#f0f0f5', commitLabelBackground: '#111118',
  tagLabelColor: '#f0f0f5', tagLabelBackground: '#1a1a24', tagLabelBorder: 'rgba(255,0,229,0.25)',
  pie1: '#00f0ff', pie2: '#ff00e5', pie3: '#ffb800', pie4: '#a855f7',
  pie5: '#00d4e0', pie6: '#ff6bc1', pie7: '#ffc940', pie8: '#c084fc',
  pie9: '#00b8cc', pie10: '#cc00b8', pie11: '#cc9400', pie12: '#7c3aed',
  pieTitleTextColor: '#f0f0f5', pieSectionTextColor: '#f0f0f5',
  pieLegendTextColor: '#b0b0c0', pieStrokeColor: '#0a0a0f',
  labelColor: '#f0f0f5', altBackground: '#111118',
}

/** 根据 data-theme 属性获取对应主题变量 */
export function resolveVars(): MermaidVars {
  const t = document.documentElement.getAttribute('data-theme') || 'neon'
  switch (t) {
    case 'neon':  return neonVars
    case 'light': return lightVars
    case 'sepia': return sepiaVars
    default:      return darkVars
  }
}
