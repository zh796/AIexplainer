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
  primaryColor:'#1D4ED8', primaryBorderColor:'#1E40AF', primaryTextColor:'#FFFFFF',
  secondaryColor:'#E2E8F0', secondaryBorderColor:'#94A3B8', secondaryTextColor:'#111111',
  tertiaryColor:'#DBEAFE', tertiaryBorderColor:'#60A5FA', tertiaryTextColor:'#333333',
  lineColor:'#94A3B8', background:'#FFFFFF', mainBkg:'#FFFFFF', secondBkg:'#F1F5F9',
  nodeBorder:'#94A3B8', clusterBkg:'#F1F5F9', clusterBorder:'#94A3B8',
  titleColor:'#111111', edgeLabelBackground:'#F1F5F9',
  darkMode:false, textColor:'#111111', labelTextColor:'#333333',
  actorBorder:'#94A3B8', actorBkg:'#F1F5F9', actorTextColor:'#111111',
  actorLineColor:'#64748B', signalColor:'#111111', signalTextColor:'#111111',
  labelBoxBkgColor:'#F1F5F9', labelBoxBorderColor:'#94A3B8',
  activationBorderColor:'#1D4ED8', activationBkgColor:'#DBEAFE',
  noteBkgColor:'#FEFCE8', noteBorderColor:'#CA8A04',
  noteTextColor:'#333333', loopTextColor:'#111111',
  sectionBkgColor:'#F1F5F9', sectionBkgColor2:'#E2E8F0',
  altSectionBkgColor:'#F8FAFC', altSectionBkgColor2:'#F1F5F9',
  taskBkgColor:'#1D4ED8', taskBorderColor:'#1E40AF', taskTextColor:'#FFFFFF',
  taskTextLightColor:'#F8FAFC', taskTextDarkColor:'#111111',
  taskTextOutsideColor:'#333333', taskTextClickableColor:'#111111',
  activeTaskBkgColor:'#F1F5F9', activeTaskBorderColor:'#64748B',
  doneTaskBkgColor:'#CBD5E1', doneTaskBorderColor:'#94A3B8',
  critBkgColor:'#FEE2E2', critBorderColor:'#EF4444',
  todayLineColor:'#D97706', gridColor:'#CBD5E1',
  classText:'#111111', entityBorder:'#94A3B8',
  commitLabelColor:'#111111', commitLabelBackground:'#F1F5F9',
  tagLabelColor:'#111111', tagLabelBackground:'#CBD5E1', tagLabelBorder:'#94A3B8',
  pie1:'#1D4ED8', pie2:'#6D28D9', pie3:'#047857', pie4:'#B45309',
  pie5:'#B91C1C', pie6:'#BE185D', pie7:'#0E7490', pie8:'#C2410C',
  pie9:'#4338CA', pie10:'#0F766E', pie11:'#9F1239', pie12:'#4D7C0F',
  pieTitleTextColor:'#111111', pieSectionTextColor:'#111111',
  pieLegendTextColor:'#333333', pieStrokeColor:'#FFFFFF',
  labelColor:'#111111', altBackground:'#F1F5F9',
}

// ====== 护眼主题 ======
const sepiaVars: MermaidVars = {
  primaryColor:'#6B3410', primaryBorderColor:'#522808', primaryTextColor:'#FDE8D0',
  secondaryColor:'#E0D0B0', secondaryBorderColor:'#A89878', secondaryTextColor:'#5C3D1A',
  tertiaryColor:'#D4C0A0', tertiaryBorderColor:'#8B7D6B', tertiaryTextColor:'#7B5530',
  lineColor:'#8B7D6B', background:'#FBF6E8', mainBkg:'#FBF6E8', secondBkg:'#EBE0C8',
  nodeBorder:'#A89878', clusterBkg:'#EBE0C8', clusterBorder:'#A89878',
  titleColor:'#5C3D1A', edgeLabelBackground:'#EBE0C8',
  darkMode:false, textColor:'#5C3D1A', labelTextColor:'#7B5530',
  actorBorder:'#A89878', actorBkg:'#EBE0C8', actorTextColor:'#5C3D1A',
  actorLineColor:'#6B5B48', signalColor:'#5C3D1A', signalTextColor:'#5C3D1A',
  labelBoxBkgColor:'#EBE0C8', labelBoxBorderColor:'#A89878',
  activationBorderColor:'#6B3410', activationBkgColor:'#D4C0A0',
  noteBkgColor:'#FBF6E8', noteBorderColor:'#A89878',
  noteTextColor:'#7B5530', loopTextColor:'#5C3D1A',
  sectionBkgColor:'#EBE0C8', sectionBkgColor2:'#E0D0B0',
  altSectionBkgColor:'#FBF6E8', altSectionBkgColor2:'#EBE0C8',
  taskBkgColor:'#6B3410', taskBorderColor:'#522808', taskTextColor:'#FDE8D0',
  taskTextLightColor:'#FBF6E8', taskTextDarkColor:'#5C3D1A',
  taskTextOutsideColor:'#8E6843', taskTextClickableColor:'#5C3D1A',
  activeTaskBkgColor:'#EBE0C8', activeTaskBorderColor:'#8B7D6B',
  doneTaskBkgColor:'#D4C0A0', doneTaskBorderColor:'#A89878',
  critBkgColor:'#F4E2D8', critBorderColor:'#C9A89A',
  todayLineColor:'#C56E00', gridColor:'#D4C0A0',
  classText:'#5C3D1A', entityBorder:'#A89878',
  commitLabelColor:'#5C3D1A', commitLabelBackground:'#EBE0C8',
  tagLabelColor:'#5C3D1A', tagLabelBackground:'#D4C0A0', tagLabelBorder:'#A89878',
  pie1:'#6B3410', pie2:'#3B5E1A', pie3:'#1B5E20', pie4:'#9A4D00',
  pie5:'#8B0000', pie6:'#9D174D', pie7:'#155E75', pie8:'#9A3412',
  pie9:'#4527A0', pie10:'#115E59', pie11:'#831843', pie12:'#3F6212',
  pieTitleTextColor:'#5C3D1A', pieSectionTextColor:'#5C3D1A',
  pieLegendTextColor:'#7B5530', pieStrokeColor:'#FBF6E8',
  labelColor:'#5C3D1A', altBackground:'#EBE0C8',
}

// ====== 霓虹主题 (Neon Abyss) ======
const neonVars: MermaidVars = {
  primaryColor: '#00f0ff', primaryBorderColor: '#33f3ff', primaryTextColor: '#0a0a0f',
  secondaryColor: '#111118', secondaryBorderColor: 'rgba(0,240,255,0.15)', secondaryTextColor: '#c4b5fd',
  tertiaryColor: '#1a1a24', tertiaryBorderColor: 'rgba(168,85,247,0.2)', tertiaryTextColor: '#a78bfa',
  lineColor: 'rgba(0,240,255,0.25)', background: '#0a0a0f', mainBkg: '#0a0a0f', secondBkg: '#111118',
  nodeBorder: 'rgba(0,240,255,0.2)', clusterBkg: '#0d0d14', clusterBorder: 'rgba(0,240,255,0.12)',
  titleColor: '#c4b5fd', edgeLabelBackground: '#111118',
  darkMode: true, textColor: '#e4d4ff', labelTextColor: '#c4b5fd',
  actorBorder: 'rgba(255,0,229,0.3)', actorBkg: '#111118', actorTextColor: '#e4d4ff',
  actorLineColor: 'rgba(0,240,255,0.3)', signalColor: '#e4d4ff', signalTextColor: '#e4d4ff',
  labelBoxBkgColor: '#111118', labelBoxBorderColor: 'rgba(0,240,255,0.2)',
  activationBorderColor: '#00f0ff', activationBkgColor: 'rgba(0,240,255,0.08)',
  noteBkgColor: '#111118', noteBorderColor: 'rgba(255,184,0,0.3)',
  noteTextColor: '#c4b5fd', loopTextColor: '#e4d4ff',
  sectionBkgColor: '#0a0a0f', sectionBkgColor2: '#111118',
  altSectionBkgColor: '#0d0d14', altSectionBkgColor2: '#111118',
  taskBkgColor: '#00f0ff', taskBorderColor: '#33f3ff', taskTextColor: '#0a0a0f',
  taskTextLightColor: '#e4d4ff', taskTextDarkColor: '#0a0a0f',
  taskTextOutsideColor: '#a78bfa', taskTextClickableColor: '#c4b5fd',
  activeTaskBkgColor: '#111118', activeTaskBorderColor: 'rgba(0,240,255,0.35)',
  doneTaskBkgColor: '#1a1a24', doneTaskBorderColor: 'rgba(0,240,255,0.15)',
  critBkgColor: 'rgba(255,0,229,0.08)', critBorderColor: 'rgba(255,0,229,0.3)',
  todayLineColor: '#ffb800', gridColor: 'rgba(0,240,255,0.06)',
  classText: '#e4d4ff', entityBorder: 'rgba(0,240,255,0.2)',
  commitLabelColor: '#e4d4ff', commitLabelBackground: '#111118',
  tagLabelColor: '#e4d4ff', tagLabelBackground: '#1a1a24', tagLabelBorder: 'rgba(255,0,229,0.25)',
  pie1: '#00f0ff', pie2: '#ff00e5', pie3: '#ffb800', pie4: '#a855f7',
  pie5: '#00d4e0', pie6: '#ff6bc1', pie7: '#ffc940', pie8: '#c084fc',
  pie9: '#00b8cc', pie10: '#cc00b8', pie11: '#cc9400', pie12: '#7c3aed',
  pieTitleTextColor: '#e4d4ff', pieSectionTextColor: '#e4d4ff',
  pieLegendTextColor: '#c4b5fd', pieStrokeColor: '#0a0a0f',
  labelColor: '#e4d4ff', altBackground: '#111118',
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
