// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Globe,
  Info,
  ShieldCheck,
  ChevronRight,
  User,
  Sparkles,
  Brain,
  Scale,
  FileText,
  Lock,
  Play,
  Square,
  History,
  BarChart3,
  Download,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useAnalytics } from '../context/AnalyticsContext';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  SettingsMain: undefined;
  Learning: undefined;
  Ethics: undefined;
  SessionHistory: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const { 
    currentSession, 
    startSession, 
    endSession, 
    sessionHistory,
    recentTerms,
    exportSession,
  } = useAnalytics();

  const [userName, setUserName] = useState('Musab Hassan');
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  };

  const handleLanguageChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleEditName = () => {
    Haptics.selectionAsync();
    setIsEditing(!isEditing);
  };

  const handleStartSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Start Chain of Custody Session',
      'This will create a tamper-evident log of all terms accessed. Select proceeding type:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deposition', onPress: () => startSession('deposition') },
        { text: 'Hearing', onPress: () => startSession('hearing') },
        { text: 'Trial', onPress: () => startSession('trial') },
        { text: 'Medical Consultation', onPress: () => startSession('medical-consultation') },
        { text: 'Emergency', onPress: () => startSession('emergency') },
      ]
    );
  };

  const handleEndSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'End Session',
      'This will finalize the chain of custody record. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: endSession },
      ]
    );
  };

  const navigateToLearning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Learning');
  };

  const navigateToEthics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Ethics');
  };

  const navigateToSessionHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SessionHistory');
  };

  const handleExportLog = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (sessionHistory.length === 0) {
      Alert.alert('No Sessions', 'There are no sessions to export yet.');
      return;
    }

    try {
      const latestSession = sessionHistory[0];
      const jsonData = await exportSession(latestSession.sessionId);
      
      await Share.share({
        message: jsonData,
        title: `Chain of Custody - ${latestSession.proceedingType}`,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export session data.');
    }
  };

  const SettingRow = ({ icon: Icon, label, value, onPress, isSwitch, switchValue, onSwitchChange, badge, badgeColor }: any) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.colors.divider }]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '12' }]}>
          <Icon size={20} color={theme.colors.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      </View>
     
      <View style={styles.rowRight}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeColor || theme.colors.primary + '15' }]}>
            <Text style={[styles.badgeText, { color: badgeColor || theme.colors.primary }]}>{badge}</Text>
          </View>
        )}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: theme.colors.inputBackground, true: theme.colors.primary + '80' }}
            thumbColor={switchValue ? theme.colors.primary : '#f4f3f4'}
            ios_backgroundColor={theme.colors.inputBackground}
          />
        ) : (
          <View style={styles.rowRightInner}>
            {value && <Text style={{ color: theme.colors.textMuted, marginRight: 8, fontSize: 14, fontWeight: '500' }}>{value}</Text>}
            <ChevronRight size={18} color={theme.colors.divider} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const SessionStatusBar = () => {
    if (!currentSession) return null;

    const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000 / 60);
    
    return (
      <TouchableOpacity 
        style={[styles.sessionBar, { backgroundColor: '#e74c3c15', borderColor: '#e74c3c30' }]}
        onPress={handleEndSession}
        activeOpacity={0.8}
      >
        <View style={styles.sessionIndicator}>
          <View style={styles.pulseDot} />
          <Text style={[styles.sessionText, { color: '#e74c3c' }]}>
            LIVE SESSION • {currentSession.proceedingType.toUpperCase().replace('-', ' ')}
          </Text>
        </View>
        <Text style={[styles.sessionTime, { color: '#e74c3c' }]}>
          {elapsed}m • {currentSession.termAccesses.length} terms
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('settings')}</Text>
      </View>
     
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SessionStatusBar />

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
         
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={[styles.nameInput, { color: theme.colors.text, borderBottomColor: theme.colors.primary }]}
                value={userName}
                onChangeText={setUserName}
                onBlur={() => setIsEditing(false)}
                autoFocus
                returnKeyType="done"
              />
            ) : (
              <TouchableOpacity onPress={handleEditName} activeOpacity={0.7}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {userName}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 2 }}>
              Tap name to edit profile
            </Text>
          </View>
         
          <TouchableOpacity onPress={handleEditName} style={[styles.editBtn, { backgroundColor: theme.colors.inputBackground }]}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chain of Custody */}
        <Text style={styles.sectionTitle}>Chain of Custody</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          {currentSession ? (
            <SettingRow
              icon={Square}
              label="End Active Session"
              value={`${currentSession.termAccesses.length} terms logged`}
              onPress={handleEndSession}
              badge="LIVE"
              badgeColor="#e74c3c"
            />
          ) : (
            <SettingRow
              icon={Play}
              label="Start New Session"
              value="Tamper-evident logging"
              onPress={handleStartSession}
            />
          )}
          <SettingRow
            icon={History}
            label="Session History"
            value={`${sessionHistory.length} records`}
            onPress={navigateToSessionHistory}
          />
          <SettingRow
            icon={Download}
            label="Export Custody Log"
            value="JSON"
            onPress={handleExportLog}
          />
        </View>

        {/* Intelligence & Learning */}
        <Text style={styles.sectionTitle}>Intelligence & Learning</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <SettingRow
            icon={Brain}
            label="Spaced Repetition"
            value="Practice flashcards"
            onPress={navigateToLearning}
          />
          <SettingRow
            icon={BarChart3}
            label="Learning Stats"
            value={`${recentTerms.length} recent lookups`}
            onPress={navigateToLearning}
          />
        </View>

        {/* Ethics & Standards */}
        <Text style={styles.sectionTitle}>Professional Standards</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <SettingRow
            icon={Scale}
            label="Ethics Guide"
            value="ISITC / NAATI"
            onPress={navigateToEthics}
          />
          <SettingRow
            icon={FileText}
            label="Code of Conduct"
            value="Reference"
            onPress={navigateToEthics}
          />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <SettingRow
            icon={Moon}
            label="Dark Mode"
            isSwitch
            switchValue={isDark}
            onSwitchChange={handleToggleTheme}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <SettingRow
            icon={Globe}
            label="App Language"
            value={language === 'en' ? 'English' : 'العربية'}
            onPress={handleLanguageChange}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
          <SettingRow icon={ShieldCheck} label="Privacy Policy" onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device. No data is transmitted to external servers.')} />
          <SettingRow icon={Info} label="App Version" value="1.0.4" />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Sparkles size={14} color={theme.colors.textMuted} />
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            Arabic Interpreter SaaS v1.0.4
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#8b949e', 
    marginBottom: 10, 
    marginTop: 28, 
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: { 
    borderRadius: 16, 
    borderWidth: 1, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 0.5,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconContainer: { padding: 10, borderRadius: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowRightInner: { flexDirection: 'row', alignItems: 'center' },
  
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
    margin: 0,
    borderBottomWidth: 2,
    marginBottom: 2,
    paddingBottom: 2,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  sessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  sessionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
  sessionText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  sessionTime: { fontSize: 12, fontWeight: '600' },

  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});