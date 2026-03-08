import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Colors, Spacing } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CastawayData {
  id: number;
  castaway: {
    full_name: string;
    name: string;
  };
}

interface DraftCastawayBlockProps {
  castaways: CastawayData[];
  selectedCastaway?: number | null;
  onCastawayPress: (castawayId: number) => void;
  disabled?: boolean;
}

// Image mapping for castaway pictures
const castawayImageMap: Record<string, any> = {
  angelina: require('../../assets/castawayPictures/angelina.webp'),
  aubry: require('../../assets/castawayPictures/aubry.webp'),
  charlie: require('../../assets/castawayPictures/charlie.webp'),
  chrissy: require('../../assets/castawayPictures/chrissy.webp'),
  christian: require('../../assets/castawayPictures/christian.webp'),
  cirie: require('../../assets/castawayPictures/cirie.webp'),
  coach: require('../../assets/castawayPictures/coach.webp'),
  colby: require('../../assets/castawayPictures/colby.webp'),
  dee: require('../../assets/castawayPictures/dee.webp'),
  emily: require('../../assets/castawayPictures/emily.webp'),
  genevieve: require('../../assets/castawayPictures/genevieve.webp'),
  jenna: require('../../assets/castawayPictures/jenna.webp'),
  joe: require('../../assets/castawayPictures/joe.webp'),
  jonathan: require('../../assets/castawayPictures/jonathan.webp'),
  kamilla: require('../../assets/castawayPictures/kamilla.webp'),
  kyle: require('../../assets/castawayPictures/kyle.webp'),
  mike: require('../../assets/castawayPictures/mike.webp'),
  ozzy: require('../../assets/castawayPictures/ozzy.webp'),
  q: require('../../assets/castawayPictures/q.webp'),
  rick: require('../../assets/castawayPictures/rick.webp'),
  rizo: require('../../assets/castawayPictures/rizo.webp'),
  savannah: require('../../assets/castawayPictures/savannah.webp'),
  stephenie: require('../../assets/castawayPictures/stephenie.webp'),
  tiffany: require('../../assets/castawayPictures/tiffany.webp'),
};

const getColumnsForWidth = (width: number): number => {
  if (width < 600) return 3;      // Mobile
  if (width < 1024) return 4;     // Tablet
  return 6;                       // Desktop/Laptop
};

const getImageForCastaway = (name: string): any => {
  const normalized = name.toLowerCase().split(/\s+/)[0];
  return castawayImageMap[normalized] || require('../../assets/placeholder.png');
};

export default function DraftCastawayBlock({
  castaways,
  selectedCastaway,
  onCastawayPress,
  disabled = false,
}: DraftCastawayBlockProps) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const columns = getColumnsForWidth(availableWidth);
  const squareSize = availableWidth > 0 ? (availableWidth - Spacing.md * (columns - 1)) / columns : 0;
  
  // Group castaways into rows based on screen size
  const rows: CastawayData[][] = [];
  for (let i = 0; i < castaways.length; i += columns) {
    rows.push(castaways.slice(i, i + columns));
  }

  return (
    <View
      style={styles.grid}
      onLayout={(event) => {
        setAvailableWidth(event.nativeEvent.layout.width);
      }}
    >
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((castaway) => (
            <TouchableOpacity
              key={castaway.id}
              style={[
                styles.castawaySquare,
                {
                  width: squareSize,
                  height: squareSize,
                },
                selectedCastaway === castaway.id && styles.castawaySquareSelected,
                disabled && styles.castawaySquareDisabled,
              ]}
              onPress={() => !disabled && onCastawayPress(castaway.id)}
              disabled={disabled}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <Image
                source={getImageForCastaway(castaway.castaway.name)}
                style={styles.castawayImage}
                resizeMode="cover"
              />
              <View style={styles.castawayNameContainer}>
                <Text
                  style={styles.castawayName}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {castaway.castaway.name}
                </Text>
              </View>
              {selectedCastaway === castaway.id && (
                <View style={styles.selectionIndicator}>
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  castawaySquare: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'space-between',
  },
  castawaySquareSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
    backgroundColor: '#e3f2fd',
  },
  castawaySquareDisabled: {
    opacity: 0.5,
  },
  castawayImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#e0e0e0',
  },
  castawayNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.sm,
  },
  castawayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
