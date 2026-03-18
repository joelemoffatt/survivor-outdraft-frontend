import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import Card from '../shared/Card';
import Chip from '../shared/Chip';
import { BorderRadius, Colors, FontSizes, Spacing } from '../../constants/theme';
import { Castaway } from '../../types/survivor';

interface CastawayProfileCardProps {
  castaway: Castaway;
  imageSource?: ImageSourcePropType | null;
}

const hasText = (value?: string | null) => Boolean(value && value.trim().length > 0);

const displayValue = (value?: string | null) => (hasText(value) ? value!.trim() : null);

const splitThreeWords = (value?: string | null) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
};

const capitalizeFirstLetter = (value: string) => {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDate = (value?: string | null) => {
  if (!hasText(value)) {
    return null;
  }

  const rawValue = value!.trim();
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getFlooredAge = (castaway: Castaway) => {
  if (typeof castaway.age === 'number' && Number.isFinite(castaway.age)) {
    return Math.floor(castaway.age);
  }

  if (!hasText(castaway.date_of_birth)) {
    return null;
  }

  const birth = new Date(castaway.date_of_birth);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function CastawayProfileCard({ castaway, imageSource }: CastawayProfileCardProps) {
  const castawayInitial = castaway.name.trim().charAt(0).toUpperCase();
  const threeWordChips = splitThreeWords(castaway.three_words).map(capitalizeFirstLetter);
  const occupation = displayValue(castaway.occupation);
  const city = displayValue(castaway.city);
  const state = displayValue(castaway.state);
  const location = city && state ? `${city}, ${state}` : city || state;
  const birthDate = formatDate(castaway.date_of_birth);
  const deathDate = formatDate(castaway.date_of_death);
  const flooredAge = getFlooredAge(castaway);
  const hobbies = displayValue(castaway.hobbies);
  const petPeeves = displayValue(castaway.pet_peeves);

  return (
    <Card shadow="medium" style={styles.card}>
      <View style={styles.heroRow}>
        <View style={styles.avatarCircle}>
          {imageSource ? (
            <Image source={imageSource} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarInitial}>{castawayInitial}</Text>
          )}
        </View>

        <View style={styles.heroTextWrap}>
          <Text style={styles.name}>{castaway.full_name || castaway.name}</Text>
          {occupation ? <Text style={styles.occupation}>{occupation}</Text> : null}

          <View style={styles.chipRow}>
            {flooredAge !== null ? <Chip label={`Age ${flooredAge}`} variant="primary" /> : null}
            {location ? <Chip label={location} variant="outline" /> : null}
          </View>
        </View>
      </View>

      {(hobbies || petPeeves) ? (
        <View style={styles.metaSection}>
          {hobbies ? (
            <>
              <Text style={styles.metaLabel}>Hobbies</Text>
              <Text style={styles.metaValue}>{hobbies}</Text>
            </>
          ) : null}

          {petPeeves ? (
            <>
              <Text style={[styles.metaLabel, hobbies ? styles.metaLabelSpaced : null]}>Pet Peeves</Text>
              <Text style={styles.metaValue}>{petPeeves}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {threeWordChips.length > 0 ? (
        <View style={styles.personalitySection}>
          <Text style={styles.personalityTitle}>Three Words</Text>
          <View style={styles.personalityWrap}>
            {threeWordChips.map((word) => <Chip key={word} label={word} variant="primary" />)}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: Colors.background,
    fontSize: FontSizes.xxlarge,
    fontWeight: '700',
  },
  heroTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSizes.xlarge,
    fontWeight: '800',
    color: Colors.text,
  },
  occupation: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  detailGrid: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.lightBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
  },
  metaSection: {
    marginTop: Spacing.md,
  },
  metaLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.xs,
  },
  metaLabelSpaced: {
    marginTop: Spacing.md,
  },
  metaValue: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: 22,
  },
  personalitySection: {
    marginTop: Spacing.lg,
  },
  personalityTitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
  personalityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
