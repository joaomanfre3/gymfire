import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF6B35', '#EF4444', '#F97316',
  '#FACC15', '#22C55E', '#14B8A6', '#3B82F6', '#6366F1',
  '#A855F7', '#EC4899', '#F43F5E', '#78350F', '#064E3B',
];

const GRAYSCALE_COLORS = [
  '#FFFFFF', '#F0F0F0', '#E0E0E0', '#CCCCCC', '#B0B0B0',
  '#999999', '#808080', '#666666', '#4D4D4D', '#333333',
  '#1A1A1A', '#000000',
];

const FONTS = [
  { label: 'Modern', family: undefined, weight: '400' as const },
  { label: 'Classic', family: 'serif', weight: '700' as const },
  { label: 'Signature', family: undefined, weight: '300' as const },
  { label: 'Editor', family: 'monospace', weight: '400' as const },
  { label: 'Poster', family: undefined, weight: '900' as const },
];

type BorderStyle = 'none' | 'white' | 'black';
type TextAlign = 'left' | 'center' | 'right';
type ActivePanel = 'none' | 'fonts' | 'colors';

interface TextItem {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  fontIndex: number;
  borderStyle: BorderStyle;
  align: TextAlign;
  x: number;
  y: number;
  scale: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  textItems: TextItem[];
  setTextItems: React.Dispatch<React.SetStateAction<TextItem[]>>;
  onEditingChange?: (editing: boolean) => void;
}

// ── Draggable Text ────────────────────────────────────────────
function DraggableText({ item, onTap }: { item: TextItem; onTap: (id: string) => void }) {
  const tx = useSharedValue(item.x);
  const ty = useSharedValue(item.y);
  const sx = useSharedValue(item.x);
  const sy = useSharedValue(item.y);
  const sc = useSharedValue(item.scale);
  const ssc = useSharedValue(item.scale);

  const pan = Gesture.Pan()
    .onUpdate((e) => { tx.value = sx.value + e.translationX; ty.value = sy.value + e.translationY; })
    .onEnd(() => { sx.value = tx.value; sy.value = ty.value; });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { sc.value = Math.min(5, Math.max(0.3, ssc.value * e.scale)); })
    .onEnd(() => { ssc.value = sc.value; });

  const tap = Gesture.Tap().onEnd(() => { runOnJS(onTap)(item.id); });
  const gesture = Gesture.Race(Gesture.Simultaneous(pan, pinch), tap);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }],
  }));

  const font = FONTS[item.fontIndex] || FONTS[0];
  const hasBorder = item.borderStyle !== 'none';
  const bgColor = item.borderStyle === 'white' ? '#FFF' : item.borderStyle === 'black' ? '#000' : 'transparent';
  const textColor = hasBorder ? (item.borderStyle === 'white' ? '#000' : '#FFF') : item.color;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[s.dragText, style]}>
        <View style={hasBorder ? [s.dragTextBorder, { backgroundColor: bgColor }] : undefined}>
          <Text style={{
            color: textColor, fontSize: item.fontSize, textAlign: item.align,
            fontFamily: font.family, fontWeight: font.weight as any,
            textShadowColor: hasBorder ? 'transparent' : 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 }, textShadowRadius: hasBorder ? 0 : 4,
          }}>{item.text}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Slider ────────────────────────────────────────────────────
const SL_H = 200;
const SL_THUMB = 22;
const MIN_F = 14;
const MAX_F = 56;

function Slider({ fontSize, onChange }: { fontSize: number; onChange: (v: number) => void }) {
  const p = useSharedValue((fontSize - MIN_F) / (MAX_F - MIN_F));
  const sp = useSharedValue(p.value);

  const update = useCallback((v: number) => { onChange(Math.round(MIN_F + v * (MAX_F - MIN_F))); }, [onChange]);

  const gesture = Gesture.Pan()
    .onStart(() => { sp.value = p.value; })
    .onUpdate((e) => {
      let n = sp.value + (-e.translationY / SL_H);
      n = Math.min(1, Math.max(0, n));
      p.value = n;
      runOnJS(update)(n);
    });

  const thumbS = useAnimatedStyle(() => ({ bottom: p.value * (SL_H - SL_THUMB) }));
  const fillS = useAnimatedStyle(() => ({ height: `${p.value * 100}%` }));

  return (
    <View style={s.slider}>
      <View style={s.slTrackWrap}>
        <View style={s.slTrack}>
          <Animated.View style={[s.slFill, fillS]} />
        </View>
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[s.slThumb, thumbS]} />
      </GestureDetector>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function TextOverlay({ visible, onClose, textItems, setTextItems, onEditingChange }: Props) {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#FFFFFF');
  const [fi, setFi] = useState(0);
  const [border, setBorder] = useState<BorderStyle>('none');
  const [align, setAlign] = useState<TextAlign>('center');
  const [size, setSize] = useState(32);
  const [panel, setPanel] = useState<ActivePanel>('none');
  const [cTab, setCTab] = useState<'preset' | 'gray'>('preset');
  const [kbH, setKbH] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const ref = useRef<TextInput>(null);

  const handleTap = useCallback((id: string) => {
    const it = textItems.find((t) => t.id === id);
    if (!it) return;
    setEditId(id); setText(it.text); setColor(it.color);
    setFi(it.fontIndex); setBorder(it.borderStyle);
    setAlign(it.align); setSize(it.fontSize);
    setEditing(true); onEditingChange?.(true);
  }, [textItems, onEditingChange]);

  useEffect(() => {
    const sh = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKbH(e.endCoordinates.height));
    const hh = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKbH(0));
    return () => { sh.remove(); hh.remove(); };
  }, []);

  const done = useCallback(() => {
    if (!text.trim()) {
      if (editId) setTextItems((p) => p.filter((t) => t.id !== editId));
      setEditId(null); setEditing(false); onEditingChange?.(false);
      setText(''); setPanel('none'); onClose(); return;
    }
    if (editId) {
      setTextItems((p) => p.map((t) => t.id === editId ? { ...t, text: text.trim(), color, fontSize: size, fontIndex: fi, borderStyle: border, align } : t));
    } else {
      setTextItems((p) => [...p, { id: Date.now().toString(), text: text.trim(), color, fontSize: size, fontIndex: fi, borderStyle: border, align, x: 0, y: 0, scale: 1 }]);
    }
    setEditId(null); setEditing(false); onEditingChange?.(false);
    setText(''); setPanel('none'); onClose();
  }, [text, color, size, fi, border, align, editId, setTextItems, onClose, onEditingChange]);

  const texts = () => textItems.map((it) => <DraggableText key={it.id} item={it} onTap={handleTap} />);
  const show = visible || editing;
  if (!show) return <>{texts()}</>;

  const font = FONTS[fi];
  const colors = cTab === 'preset' ? PRESET_COLORS : GRAYSCALE_COLORS;

  return (
    <>
      {texts()}
      <View style={[s.overlay, { paddingBottom: kbH }]}>
        {/* ── Top: Confirm ── */}
        <View style={s.top}>
          <TouchableOpacity onPress={() => { setEditing(false); onEditingChange?.(false); setText(''); setPanel('none'); onClose(); }}>
            <Ionicons name="arrow-back" size={26} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={done} style={s.confirmBtn}>
            <Ionicons name="checkmark" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* ── Middle: Slider + Input ── */}
        <View style={s.middle}>
          <Slider fontSize={size} onChange={setSize} />
          <View style={s.inputArea}>
            <TextInput
              ref={ref}
              style={[s.input, { color, fontSize: size, textAlign: align, fontFamily: font.family, fontWeight: font.weight as any }]}
              value={text} onChangeText={setText}
              placeholder="Digite aqui..." placeholderTextColor="rgba(255,255,255,0.2)"
              multiline autoFocus
            />
          </View>
        </View>

        {/* ── Expand: Fonts ── */}
        {panel === 'fonts' && (
          <View style={s.expandRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.expandScroll}>
              {FONTS.map((f, i) => (
                <TouchableOpacity key={f.label} onPress={() => setFi(i)}
                  style={[s.fontPill, fi === i && s.fontPillOn]}>
                  <Text style={[s.fontPillTxt, { fontFamily: f.family, fontWeight: f.weight as any }, fi === i && s.fontPillTxtOn]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Expand: Colors ── */}
        {panel === 'colors' && (
          <View style={s.expandRow}>
            <View style={s.cTabRow}>
              <TouchableOpacity onPress={() => setCTab('preset')} style={[s.cTabBtn, cTab === 'preset' && s.cTabBtnOn]}>
                <Ionicons name="color-palette" size={18} color={cTab === 'preset' ? '#FFF' : 'rgba(255,255,255,0.4)'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCTab('gray')} style={[s.cTabBtn, cTab === 'gray' && s.cTabBtnOn]}>
                <View style={s.grayIcon}>
                  <View style={{ flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />
                  <View style={{ flex: 1, backgroundColor: '#333', borderTopRightRadius: 3, borderBottomRightRadius: 3 }} />
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.expandScroll}>
              {colors.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={[s.cDot, { backgroundColor: c }, color === c && s.cDotOn]}>
                  {color === c && <Ionicons name="checkmark" size={14} color={c === '#FFFFFF' || c === '#FACC15' || c === '#F0F0F0' || c === '#E0E0E0' ? '#000' : '#FFF'} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Toolbar ── */}
        <View style={s.toolbar}>
          {/* Aa */}
          <TouchableOpacity onPress={() => setPanel(p => p === 'fonts' ? 'none' : 'fonts')}
            style={[s.tBtn, panel === 'fonts' && s.tBtnOn]}>
            <Text style={[s.tBtnTxt, panel === 'fonts' && s.tBtnTxtOn]}>Aa</Text>
          </TouchableOpacity>

          {/* Colors */}
          <TouchableOpacity onPress={() => setPanel(p => p === 'colors' ? 'none' : 'colors')}
            style={[s.tBtn, panel === 'colors' && s.tBtnOn]}>
            <View style={s.cWheel}>
              <View style={[s.cQ, { backgroundColor: '#EF4444', borderTopLeftRadius: 9 }]} />
              <View style={[s.cQ, { backgroundColor: '#FACC15', borderTopRightRadius: 9 }]} />
              <View style={[s.cQ, { backgroundColor: '#3B82F6', borderBottomLeftRadius: 9 }]} />
              <View style={[s.cQ, { backgroundColor: '#22C55E', borderBottomRightRadius: 9 }]} />
            </View>
          </TouchableOpacity>

          {/* Align */}
          <TouchableOpacity onPress={() => setAlign(a => a === 'center' ? 'left' : a === 'left' ? 'right' : 'center')} style={s.tBtn}>
            <View style={{ gap: 2.5, alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
              <View style={{ width: 16, height: 2, backgroundColor: '#FFF', borderRadius: 1 }} />
              <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
              <View style={{ width: 14, height: 2, backgroundColor: '#FFF', borderRadius: 1 }} />
              <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
            </View>
          </TouchableOpacity>

          {/* Border */}
          <TouchableOpacity onPress={() => setBorder(b => b === 'none' ? 'white' : b === 'white' ? 'black' : 'none')} style={s.tBtn}>
            {border === 'none' ? (
              <View style={s.borderNone}><Text style={s.borderTxt}>A</Text></View>
            ) : (
              <View style={[s.borderFill, { backgroundColor: border === 'white' ? '#FFF' : '#000', borderColor: border === 'black' ? '#FFF' : 'transparent', borderWidth: border === 'black' ? 1 : 0 }]}>
                <Text style={[s.borderTxt, { color: border === 'white' ? '#000' : '#FFF' }]}>A</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Mention ── */}
        <View style={s.mentionRow}>
          <TouchableOpacity style={s.mentionBtn}>
            <View style={s.mentionIcon}>
              <Text style={s.mentionAt}>@</Text>
            </View>
            <Text style={s.mentionLabel}>Mencionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

export type { TextItem };

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  dragText: { position: 'absolute', zIndex: 5, alignSelf: 'center', top: SCREEN_HEIGHT * 0.35 },
  dragTextBorder: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 20 },

  // Top
  top: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 4,
  },
  confirmBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  // Middle
  middle: { flex: 1, flexDirection: 'row', paddingLeft: 4 },

  // Slider
  slider: { width: 40, height: SL_H, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  slTrackWrap: { height: SL_H - SL_THUMB, justifyContent: 'flex-end', alignItems: 'center' },
  slTrack: {
    width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-end',
  },
  slFill: { width: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 },
  slThumb: {
    position: 'absolute', width: SL_THUMB, height: SL_THUMB, borderRadius: SL_THUMB / 2,
    backgroundColor: '#FFF', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },

  // Input
  inputArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 8, paddingRight: 20 },
  input: { textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },

  // Expand row
  expandRow: { paddingBottom: 6 },
  expandScroll: { paddingHorizontal: 14, gap: 8, alignItems: 'center', paddingVertical: 6 },

  // Fonts
  fontPill: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  fontPillOn: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.6)' },
  fontPillTxt: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  fontPillTxtOn: { color: '#FFF' },

  // Color tabs
  cTabRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 6, marginBottom: 4 },
  cTabBtn: { padding: 6, borderRadius: 8 },
  cTabBtnOn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  grayIcon: { width: 18, height: 18, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  // Color dots
  cDot: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  cDotOn: { borderColor: '#FFF', borderWidth: 2.5, transform: [{ scale: 1.15 }] },

  // Toolbar
  toolbar: {
    flexDirection: 'row', justifyContent: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  tBtnOn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tBtnTxt: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  tBtnTxtOn: { color: '#FFF' },

  // Color wheel
  cWheel: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' },
  cQ: { width: 11, height: 11 },

  // Border icons
  borderNone: {
    width: 24, height: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5, alignItems: 'center', justifyContent: 'center',
  },
  borderFill: { width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  borderTxt: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Mention
  mentionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 },
  mentionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mentionIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  mentionAt: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  mentionLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
});
