import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ported from Shift's "Who's Up" admin view: everyone puts a finger on the
// screen, tap Start, and a randomly chosen player's color floods the screen.

const PALETTE = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#ec4899', // magenta
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // purple
  '#fca5a5', // red-light
  '#93c5fd', // blue-light
  '#86efac', // green-light
  '#fde047', // yellow-light
  '#f9a8d4', // magenta-light
  '#67e8f9', // cyan-light
  '#fdba74', // orange-light
  '#d8b4fe', // purple-light
];

const CIRCLE_RADIUS = 55;
const CORNER_BUTTON_SIZE = 48;
const CORNER_BUTTON_MARGIN = 12;
const START_ZONE_HEIGHT = 72;
const START_ZONE_BOTTOM_OFFSET = 24;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type Player = {
  id: string; // touch identifier
  colorIdx: number;
  x: number;
  y: number;
};

type Phase = 'registering' | 'cycling' | 'winner';

function PulseRing({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const size = CIRCLE_RADIUS * 2 + 24;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: color,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
      }}
    />
  );
}

function PlayerCircle({
  player,
  highlighted,
  isWinner,
  isLoser,
}: {
  player: Player;
  highlighted: boolean;
  isWinner: boolean;
  isLoser: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const color = PALETTE[player.colorIdx];

  useEffect(() => {
    if (isWinner) {
      Animated.timing(scale, {
        toValue: 60,
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  }, [isWinner, scale]);

  useEffect(() => {
    if (isLoser) {
      Animated.timing(opacity, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: USE_NATIVE_DRIVER }).start();
    }
  }, [isLoser, opacity]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: player.x, top: player.y, zIndex: isWinner ? 5 : 1 }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: -CIRCLE_RADIUS,
          top: -CIRCLE_RADIUS,
          width: CIRCLE_RADIUS * 2,
          height: CIRCLE_RADIUS * 2,
          borderRadius: CIRCLE_RADIUS,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
          shadowColor: color,
          shadowOpacity: 0.5,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      {highlighted && <PulseRing color={color} />}
    </View>
  );
}

export default function WhosUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('registering');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const nextColorIdxRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  };

  const reset = useCallback(() => {
    clearTimeouts();
    setPlayers([]);
    setPhase('registering');
    setHighlightIdx(null);
    setWinnerIdx(null);
    nextColorIdxRef.current = 0;
  }, []);

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  const close = useCallback(() => {
    clearTimeouts();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/more');
    }
  }, [router]);

  // Touches landing on the corner buttons or the start strip are not players.
  const cornerZone = CORNER_BUTTON_SIZE + CORNER_BUTTON_MARGIN * 2;
  const isReservedZone = useCallback(
    (x: number, y: number) => {
      const top = insets.top;
      if (y <= top + cornerZone && (x <= cornerZone || x >= viewportWidth - cornerZone)) return true;
      const startZoneTop = viewportHeight - insets.bottom - START_ZONE_BOTTOM_OFFSET - START_ZONE_HEIGHT - 40;
      return y >= startZoneTop;
    },
    [cornerZone, insets.top, insets.bottom, viewportWidth, viewportHeight],
  );

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (phase === 'winner') {
        reset();
        return;
      }
      if (phase !== 'registering') return;
      const additions: Player[] = [];
      for (const t of e.nativeEvent.changedTouches) {
        const x = t.pageX;
        const y = t.pageY;
        if (isReservedZone(x, y)) continue;
        additions.push({
          id: String(t.identifier),
          colorIdx: nextColorIdxRef.current++ % PALETTE.length,
          x,
          y,
        });
      }
      if (additions.length) {
        setPlayers((prev) => [...prev.filter((p) => !additions.some((a) => a.id === p.id)), ...additions]);
      }
    },
    [phase, reset, isReservedZone],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (phase !== 'registering') return;
      const moved = new Map<string, { x: number; y: number }>();
      for (const t of e.nativeEvent.changedTouches) {
        moved.set(String(t.identifier), { x: t.pageX, y: t.pageY });
      }
      setPlayers((prev) => prev.map((p) => (moved.has(p.id) ? { ...p, ...moved.get(p.id)! } : p)));
    },
    [phase],
  );

  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      if (phase !== 'registering') return;
      const gone = new Set<string>();
      for (const t of e.nativeEvent.changedTouches) {
        gone.add(String(t.identifier));
      }
      setPlayers((prev) => prev.filter((p) => !gone.has(p.id)));
    },
    [phase],
  );

  const start = useCallback(() => {
    if (players.length < 2) return;
    setPhase('cycling');
    const winner = Math.floor(Math.random() * players.length);
    setWinnerIdx(winner);

    // Build a sequence of highlight indices ending on `winner`, steadily
    // decelerating over 5-7 seconds.
    const total = 5000 + Math.random() * 2000;
    const minDelay = 70;
    const maxDelay = 350;
    const avg = (minDelay + maxDelay) / 2;
    const N = Math.max(8, Math.round(total / avg));

    const rawDelays: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      rawDelays.push(minDelay + (maxDelay - minDelay) * Math.pow(t, 2.2));
    }
    const sum = rawDelays.reduce((a, b) => a + b, 0);
    const delays = rawDelays.map((d) => d * (total / sum));

    const P = players.length;
    const seq: number[] = [];
    let cur = Math.floor(Math.random() * P);
    for (let i = 0; i < N - 1; i++) {
      cur = (cur + 1) % P;
      seq.push(cur);
    }
    seq.push(winner);

    let elapsed = 0;
    for (let i = 0; i < N; i++) {
      elapsed += delays[i];
      const idx = seq[i];
      const isLast = i === N - 1;
      const t = setTimeout(() => {
        setHighlightIdx(idx);
        if (isLast) {
          timeoutsRef.current.push(setTimeout(() => setPhase('winner'), 300));
        }
      }, elapsed);
      timeoutsRef.current.push(t);
    }
  }, [players.length]);

  const canStart = phase === 'registering' && players.length >= 2;
  const winnerColor = winnerIdx !== null ? PALETTE[players[winnerIdx]?.colorIdx ?? 0] : null;

  const startLabel =
    phase === 'cycling'
      ? ''
      : canStart
        ? 'Start'
        : players.length === 0
          ? 'Touch the screen to add players'
          : 'Add another finger…';

  return (
    <Modal visible animationType="none" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={close}>
      <View
        style={[styles.root, phase === 'winner' && winnerColor ? { backgroundColor: winnerColor } : null, webTouchStyle]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {players.map((p, i) => (
          <PlayerCircle
            key={p.id}
            player={p}
            highlighted={phase === 'cycling' && highlightIdx === i}
            isWinner={phase === 'winner' && winnerIdx === i}
            isLoser={phase === 'winner' && winnerIdx !== i}
          />
        ))}

        {/* Corner buttons hide during winner phase so the color flood covers everything */}
        {phase !== 'winner' && (
          <>
            <Pressable
              accessibilityLabel="Reset"
              accessibilityRole="button"
              onPress={reset}
              style={[styles.cornerButton, { top: insets.top + CORNER_BUTTON_MARGIN, left: CORNER_BUTTON_MARGIN }]}
            >
              <Text style={styles.cornerButtonText}>↻</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={close}
              style={[styles.cornerButton, { top: insets.top + CORNER_BUTTON_MARGIN, right: CORNER_BUTTON_MARGIN }]}
            >
              <Text style={styles.cornerButtonText}>×</Text>
            </Pressable>
          </>
        )}

        {phase !== 'winner' && (
          <View
            pointerEvents="box-none"
            style={[styles.startRow, { bottom: insets.bottom + START_ZONE_BOTTOM_OFFSET }]}
          >
            <Pressable
              accessibilityRole="button"
              disabled={!canStart}
              onPress={start}
              style={[
                styles.startButton,
                canStart ? styles.startButtonActive : styles.startButtonIdle,
                phase === 'cycling' && styles.hidden,
              ]}
            >
              <Text style={[styles.startText, canStart ? styles.startTextActive : styles.startTextIdle]}>{startLabel}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Prevent browser scrolling/zooming/text selection while fingers are down.
const webTouchStyle =
  Platform.OS === 'web'
    ? ({ touchAction: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' } as object)
    : null;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  cornerButton: {
    position: 'absolute',
    width: CORNER_BUTTON_SIZE,
    height: CORNER_BUTTON_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cornerButtonText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 26,
  },
  startRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  startButton: {
    height: START_ZONE_HEIGHT,
    borderRadius: 999,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonActive: {
    backgroundColor: '#fff',
  },
  startButtonIdle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  hidden: {
    opacity: 0,
  },
  startText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  startTextActive: {
    color: '#000',
  },
  startTextIdle: {
    color: '#888',
  },
});
