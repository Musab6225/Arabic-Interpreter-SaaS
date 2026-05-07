// src/screens/EthicsScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ShieldCheck,
  Repeat,
  Scale,
  Heart,
  Slash,
  UserCheck,
  Globe,
  ChevronLeft,
  BadgeCheck,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

interface Principle {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  description: string;
  bullets: string[];
}

const PRINCIPLES: Principle[] = [
  {
    key: 'confidentiality',
    title: 'Confidentiality',
    subtitle: 'HIPAA Compliance',
    icon: ShieldCheck,
    accentColor: '#7C3AED',
    description:
      'Interpreters must maintain strict privacy and confidentiality for all parties at all times. In healthcare settings, this includes full compliance with HIPAA regulations governing Protected Health Information (PHI).',
    bullets: [
      'Never disclose PHI or session content to unauthorized individuals.',
      'Confidentiality obligations extend beyond the conclusion of the assignment.',
      'Report any suspected HIPAA violations through the appropriate institutional channels.',
    ],
  },
  {
    key: 'accuracy',
    title: 'Accuracy & Fidelity',
    subtitle: 'NCIHC Standard 1',
    icon: Repeat,
    accentColor: '#2563EB',
    description:
      'The interpreter must render the complete message accurately — conveying both content and spirit — without omissions, additions, or distortions. The register (level of formality and complexity) of the original speaker must be preserved.',
    bullets: [
      'Convey everything said, including tone, emotion, and register.',
      'Do not simplify, summarize, or editorialize the source message.',
      'Transparently note when a direct linguistic equivalent does not exist.',
    ],
  },
  {
    key: 'impartiality',
    title: 'Impartiality',
    subtitle: 'NAJIT Canon II',
    icon: Scale,
    accentColor: '#D97706',
    description:
      'The interpreter must remain strictly neutral and eliminate even the appearance of a conflict of interest. Personal opinions, biases, or affiliations must never influence the interpreted interaction.',
    bullets: [
      'Disclose any prior relationship with a party before the session begins.',
      'Do not advocate for, advise, or align with any party.',
      'Withdraw from an assignment if impartiality cannot be guaranteed.',
    ],
  },
  {
    key: 'respect',
    title: 'Respect',
    subtitle: 'NCIHC Standard 6',
    icon: Heart,
    accentColor: '#DC2626',
    description:
      'The interpreter must treat all parties with dignity and respect at all times, remaining mindful of cultural differences, power dynamics, and professional boundaries throughout every interaction.',
    bullets: [
      'Use appropriate titles and forms of address for all parties.',
      'Acknowledge cultural differences without judgment or assumption.',
      'Maintain professional boundaries even when subject matter is distressing.',
    ],
  },
  {
    key: 'role-boundaries',
    title: 'Role Boundaries',
    subtitle: 'NCIHC Standard 4',
    icon: Slash,
    accentColor: '#DC2626',
    description:
      'The interpreter\'s sole function is to facilitate accurate communication between parties. Personal involvement, unsolicited advice, and acting as a counselor, advocate, or legal advisor are strictly outside the scope of this role.',
    bullets: [
      'Refrain from offering legal, medical, financial, or personal advice.',
      'Do not act as a case manager, patient advocate, or cultural broker beyond interpreting.',
      'Intervene only to clarify a linguistic or cultural misunderstanding, and do so transparently.',
    ],
  },
  {
    key: 'professionalism',
    title: 'Professionalism',
    subtitle: 'NAJIT Canon V',
    icon: UserCheck,
    accentColor: '#059669',
    description:
      'Professional conduct, punctuality, and appropriate attire are non-negotiable standards. Interpreters must also exercise sound judgment in accepting only assignments that fall within their certified skill level and subject-matter competency.',
    bullets: [
      'Arrive prepared and on time; notify the client promptly if delays occur.',
      'Decline assignments that exceed your language proficiency or subject-matter expertise.',
      'Pursue continuing education and maintain any required certifications.',
    ],
  },
  {
    key: 'cultural-awareness',
    title: 'Cultural Awareness',
    subtitle: 'NCIHC Standard 7',
    icon: Globe,
    accentColor: '#0891B2',
    description:
      'The interpreter must actively assess interactions for cultural misunderstandings and provide the necessary cultural framework to ensure both parties achieve genuine mutual understanding — without imposing personal cultural perspectives.',
    bullets: [
      'Identify when a cultural concept lacks a direct equivalent and bridge the gap transparently.',
      'Intervene to prevent cultural misunderstandings from derailing communication.',
      'Pursue ongoing education in the cultures associated with your working languages.',
    ],
  },
];

export default function EthicsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Code of Ethics
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            NCIHC · NAJIT · HIPAA
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.primary + '28',
            },
          ]}
        >
          <View style={[styles.heroIconWrap, { backgroundColor: theme.colors.primary + '18' }]}>
            <BadgeCheck size={30} color={theme.colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            U.S. National Standards of{'\n'}Professional Conduct
          </Text>
          <Text style={[styles.heroBody, { color: theme.colors.textSecondary }]}>
            Grounded in the NCIHC National Standards of Practice, NAJIT Code of Ethics, and federal HIPAA regulations — the authoritative framework for professional interpreters in the United States.
          </Text>
        </View>

        {/* Principle cards */}
        {PRINCIPLES.map((p, index) => {
          const Icon = p.icon;
          return (
            <View
              key={p.key}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.cardBorder,
                  ...theme.shadows.sm,
                },
              ]}
            >
              {/* Left accent bar */}
              <View style={[styles.accentBar, { backgroundColor: p.accentColor }]} />

              <View style={styles.cardInner}>
                {/* Card header row */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: p.accentColor + '18' }]}>
                    <Icon size={20} color={p.accentColor} />
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                      {p.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: p.accentColor }]}>
                      {p.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.cardIndex, { color: theme.colors.textMuted }]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </View>

                {/* Description */}
                <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                  {p.description}
                </Text>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

                {/* Bullets */}
                <View style={styles.bulletList}>
                  {p.bullets.map((bullet, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: p.accentColor }]} />
                      <Text style={[styles.bulletText, { color: theme.colors.textSecondary }]}>
                        {bullet}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerLine, { backgroundColor: theme.colors.divider }]} />
          <Text style={[styles.footerSource, { color: theme.colors.textMuted }]}>
            Sources: NCIHC (2005), NAJIT Code of Ethics (2018), 45 CFR §164 (HIPAA)
          </Text>
          <Text style={[styles.footerDate, { color: theme.colors.textMuted }]}>
            Last updated: June 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 52,
  },

  // Hero
  hero: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 22,
    marginBottom: 24,
    gap: 12,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flex: 1,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitles: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardIndex: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },

  // Bullets
  bulletList: {
    gap: 9,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  footerLine: {
    height: 1,
    width: '50%',
    marginBottom: 4,
  },
  footerSource: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  footerDate: {
    fontSize: 11,
    textAlign: 'center',
  },
});
