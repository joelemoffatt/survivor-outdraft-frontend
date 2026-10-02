import { ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CastawayProfileCard from './CastawayProfileCard';
import Button from '../shared/Button';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { Castaway } from '../../types/survivor';

interface DraftCastawayModalProps {
  visible: boolean;
  castaway: Castaway | null;
  imageSource?: ImageSourcePropType | null;
  canDraft: boolean;
  isDrafting: boolean;
  onDraft: () => void;
  onClose: () => void;
}

export default function DraftCastawayModal({
  visible,
  castaway,
  imageSource,
  canDraft,
  isDrafting,
  onDraft,
  onClose,
}: DraftCastawayModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stop taps inside the sheet from closing it */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {castaway && <CastawayProfileCard castaway={castaway} imageSource={imageSource} />}
          </ScrollView>

          {canDraft && (
            <Button
              label={`Draft ${castaway?.name ?? 'Castaway'}`}
              onPress={onDraft}
              variant="primary"
              size="lg"
              fullWidth
              loading={isDrafting}
              disabled={isDrafting}
              style={styles.draftButton}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingTop: Spacing.xl + Spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    padding: Spacing.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: Spacing.sm,
  },
  draftButton: {
    marginTop: Spacing.md,
  },
});
