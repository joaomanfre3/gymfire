import React, { useState, useMemo, useRef } from 'react';
import { TextInput, View, StyleProp, TextStyle, StyleSheet } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
  getActiveMentionQuery,
  insertMention,
  recomputeMentions,
  Mention,
} from './mentionParser';
import { MentionSuggestionList } from './MentionSuggestionList';
import { useMentionSearch } from './useMentionSearch';

interface MentionInputProps {
  value: string;
  mentions: Mention[];
  onChange: (text: string, mentions: Mention[]) => void;
  inSheet?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  style?: StyleProp<TextStyle>;
}

export function MentionInput({
  value,
  mentions,
  onChange,
  inSheet,
  placeholder,
  maxLength,
  autoFocus,
  style,
}: MentionInputProps) {
  const inputRef = useRef<any>(null);
  const [cursorPos, setCursorPos] = useState(value.length);
  const activeQuery = useMemo(
    () => getActiveMentionQuery(value, cursorPos),
    [value, cursorPos],
  );
  const { results } = useMentionSearch(activeQuery?.query);

  const handleSelect = (user: { id: string; username: string }) => {
    const { text: newText, cursorPosition: newCursor } = insertMention({
      text: value,
      cursorPosition: cursorPos,
      username: user.username,
    });
    const newMention: Mention = {
      userId: user.id,
      username: user.username,
      start: activeQuery!.start,
      end: activeQuery!.start + user.username.length + 1,
    };
    onChange(newText, [...mentions, newMention]);
    setTimeout(() => {
      inputRef.current?.setNativeProps?.({
        selection: { start: newCursor, end: newCursor },
      });
    }, 0);
  };

  const Input = inSheet ? BottomSheetTextInput : TextInput;

  return (
    <View style={styles.wrapper}>
      {activeQuery && results.length > 0 && (
        <MentionSuggestionList results={results} onSelect={handleSelect} />
      )}
      <Input
        ref={inputRef}
        value={value}
        onChangeText={(t: string) => onChange(t, recomputeMentions(t, mentions))}
        onSelectionChange={(e: any) => setCursorPos(e.nativeEvent.selection.start)}
        placeholder={placeholder}
        placeholderTextColor="#a8a8a8"
        multiline
        maxLength={maxLength}
        autoFocus={autoFocus}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  input: { fontSize: 14, color: '#fff' },
});
