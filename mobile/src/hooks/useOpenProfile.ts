import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useOpenProfile() {
  const navigation = useNavigation<any>();
  return useCallback(
    (userId: string) => {
      navigation.navigate('Profile', { userId });
    },
    [navigation],
  );
}
