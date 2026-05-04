import React, { useRef } from 'react';
import { Alert, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { useSheetsStore } from '../store/sheetsStore';
import { useAuthStore } from '../../../stores/authStore';
import { postEvents } from '../../../lib/postEvents';
import SheetRow from './components/SheetRow';
import SheetDivider from './components/SheetDivider';
import type { Post } from '../../../components/Post/types';

interface Props {
  post: Post;
}

export default function PostMenuSheet({ post }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const close = useSheetsStore((s) => s.close);
  const open = useSheetsStore((s) => s.open);
  const currentUser = useAuthStore((s) => s.user) as any;
  const navigation = useNavigation<any>();

  const isAuthor = (post.viewerIsAuthor ?? false) || post.author.id === currentUser?.id;

  const handleEdit = () => {
    close();
    navigation.navigate('NewPost', { mode: 'edit', postId: post.id });
  };

  const handleDelete = () => {
    close();
    Alert.alert('Remover publicação?', 'Você não poderá desfazer essa ação.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          // TODO slice 2: chama deletePost otimista via usePostActions
          Alert.alert('Em breve', 'Remoção será implementada na próxima fatia.');
        },
      },
    ]);
  };

  const handleCopyLink = () => {
    close();
    Alert.alert('', 'Link copiado!');
    // TODO: Clipboard.setStringAsync após native rebuild com expo-clipboard
  };

  const handleShareSystem = () => {
    close();
    // TODO: Share.share({ url, message: post.caption })
    Alert.alert('Em breve', 'Compartilhar via sistema será implementado.');
  };

  const handleHide = () => {
    close();
    postEvents.emit({ type: 'remove', postId: post.id });
    Alert.alert('', 'Post ocultado');
  };

  const handleReport = () => {
    close();
    open({ type: 'reportPost', postId: post.id });
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      enablePanDownToClose
      enableDynamicSizing
      onClose={close}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.5}
        />
      )}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        {isAuthor ? (
          <>
            <SheetRow icon="edit-2" label="Editar publicação" onPress={handleEdit} />
            <SheetRow icon="link" label="Copiar link" onPress={handleCopyLink} />
            <SheetRow icon="share-2" label="Compartilhar via..." onPress={handleShareSystem} />
            <SheetDivider />
            <SheetRow icon="trash-2" label="Remover publicação" onPress={handleDelete} destructive />
          </>
        ) : (
          <>
            <SheetRow icon="link" label="Copiar link" onPress={handleCopyLink} />
            <SheetRow icon="share-2" label="Compartilhar via..." onPress={handleShareSystem} />
            <SheetRow icon="eye-off" label="Ocultar este post" onPress={handleHide} />
            <SheetDivider />
            <SheetRow icon="flag" label="Denunciar" onPress={handleReport} destructive />
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handle: { backgroundColor: '#555' },
  content: { paddingBottom: 24 },
});
