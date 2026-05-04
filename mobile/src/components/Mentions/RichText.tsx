import React, { useMemo } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { buildSegments, Mention } from './mentionParser';

interface RichTextProps {
  text: string;
  mentions?: Mention[];
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export function RichText({ text, mentions = [], numberOfLines, style }: RichTextProps) {
  const navigation = useNavigation<any>();
  const segments = useMemo(() => buildSegments(text, mentions), [text, mentions]);

  return (
    <Text numberOfLines={numberOfLines} style={style}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <Text key={i}>{seg.content}</Text>;
        const { mention } = seg;
        return (
          <Text
            key={i}
            style={{ color: '#3B82F6' }}
            onPress={() => {
              if (mention.userId) {
                navigation.navigate('Profile', { userId: mention.userId });
              }
            }}
          >
            @{mention.username}
          </Text>
        );
      })}
    </Text>
  );
}
