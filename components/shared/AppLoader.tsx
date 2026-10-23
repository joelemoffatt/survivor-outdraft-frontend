import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes } from '../../constants/theme';

const base = require('../../assets/torch-base.png');
const flameFrames = [
  require('../../assets/flame-frames/flame-0.png'),
  require('../../assets/flame-frames/flame-1.png'),
  require('../../assets/flame-frames/flame-2.png'),
  require('../../assets/flame-frames/flame-3.png'),
  require('../../assets/flame-frames/flame-4.png'),
  require('../../assets/flame-frames/flame-5.png'),
  require('../../assets/flame-frames/flame-6.png'),
  require('../../assets/flame-frames/flame-7.png'),
  require('../../assets/flame-frames/flame-8.png'),
  require('../../assets/flame-frames/flame-9.png'),
];
const FRAME_INTERVAL_MS = 100;

interface Props {
  label?: string;
}

// Geometry: in a 100x100 icon frame, the circle fills the frame and the cap top
// sits at y = 240/512 * 100 ≈ 46.9. Flame frames are 512w × 210h with the flame
// base always touching the bottom edge of each frame.
const ICON_SIZE = 180;
// Nudge the flame base down ~3px so it sits ON the cap edge, not floating above it.
const CAP_OVERLAP = 1;
const CAP_TOP = (ICON_SIZE * 240) / 512 + CAP_OVERLAP;
// The flame frame PNG is 512w × 251h; content is centered horizontally and
// bottom-aligned. Size the whole image to match the icon's horizontal scale
// so the flame content ends up at the natural proportion of the original torch.
const FRAME_W = 512;
const FRAME_H = 241;
const FLAME_WIDTH = ICON_SIZE;                                   // full icon width
const FLAME_HEIGHT = (FLAME_WIDTH / FRAME_W) * FRAME_H;           // keep PNG aspect

export default function AppLoader({ label = 'Loading...' }: Props) {
  const [frame, setFrame] = useState(0);
  const [framesReady, setFramesReady] = useState(false);

  // Preload all flame frames; only start cycling once every one is in the cache.
  // Until then, show frame 0 as a static image so the user sees the full torch immediately.
  useEffect(() => {
    let cancelled = false;

    // Resolve each require()'d asset to a URI, working on both web (string URL)
    // and native (numeric asset id → resolveAssetSource).
    const toUri = (asset: unknown): string | null => {
      if (typeof asset === 'string') return asset;
      if (asset && typeof asset === 'object' && 'uri' in asset) {
        return (asset as { uri: string }).uri;
      }
      const resolve = (Image as { resolveAssetSource?: (a: unknown) => { uri: string } })
        .resolveAssetSource;
      if (resolve) return resolve(asset).uri;
      return null;
    };

    const uris = flameFrames.map(toUri).filter((u): u is string => !!u);
    if (uris.length === 0) {
      setFramesReady(true);
      return;
    }

    Promise.all(uris.map((u) => Image.prefetch(u)))
      .then(() => {
        if (!cancelled) setFramesReady(true);
      })
      .catch(() => {
        if (!cancelled) setFramesReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!framesReady) return;
    const id = setInterval(
      () => setFrame((f) => (f + 1) % flameFrames.length),
      FRAME_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [framesReady]);

  return (
    <View style={styles.container}>
      <View style={styles.iconFrame}>
        <Image source={base} style={styles.icon} />
        <Image source={flameFrames[framesReady ? frame : 0]} style={styles.flame} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
  },
  iconFrame: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  icon: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    resizeMode: 'contain',
  },
  flame: {
    // Position the flame so its BOTTOM edge sits exactly on the cap top.
    position: 'absolute',
    left: (ICON_SIZE - FLAME_WIDTH) / 2,
    top: CAP_TOP - FLAME_HEIGHT,
    width: FLAME_WIDTH,
    height: FLAME_HEIGHT,
    resizeMode: 'stretch',
  },
  label: {
    marginTop: 16,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
});
