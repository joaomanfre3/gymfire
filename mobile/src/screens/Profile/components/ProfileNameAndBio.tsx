import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface Props {
  name: string;
  bio: string;
  verified?: boolean;
}

const URL_RE = /(https?:\/\/[^\s]+)/g;

function renderBio(bio: string) {
  const trimmed = bio.trim();
  // Bio is only a URL → render with link icon
  if (URL_RE.test(trimmed) && trimmed.match(URL_RE)?.[0] === trimmed) {
    URL_RE.lastIndex = 0;
    return (
      <View style={styles.linkOnlyRow}>
        <Feather name="link" size={12} color="#3B82F6" style={{ marginRight: 4 }} />
        <Text
          style={styles.link}
          numberOfLines={1}
          onPress={() => Linking.openURL(trimmed).catch(() => {})}
        >
          {trimmed}
        </Text>
      </View>
    );
  }
  URL_RE.lastIndex = 0;

  // Mixed text: split into parts, wrap URLs
  const parts = trimmed.split(URL_RE);
  return (
    <Text style={styles.bio} numberOfLines={3}>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <Text
              key={i}
              style={styles.link}
              onPress={() => Linking.openURL(part).catch(() => {})}
            >
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export default function ProfileNameAndBio({ name, bio, verified }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{name}</Text>
        {verified && (
          <MaterialCommunityIcons
            name="check-decagram"
            size={14}
            color="#3B82F6"
            style={{ marginLeft: 4 }}
          />
        )}
      </View>
      {bio ? <View style={{ marginTop: 2 }}>{renderBio(bio)}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: '#fff' },
  bio: { fontSize: 14, fontWeight: '400', color: '#fff', lineHeight: 19 },
  link: { fontSize: 14, color: '#3B82F6' },
  linkOnlyRow: { flexDirection: 'row', alignItems: 'center' },
});
