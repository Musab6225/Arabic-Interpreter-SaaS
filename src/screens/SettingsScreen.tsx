import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Moon, Globe, Info, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  // State for the editable name
  const [userName, setUserName] = useState('Musab Hassan');
  const [isEditing, setIsEditing] = useState(false);

  const SettingRow = ({ icon: Icon, label, value, onPress, isSwitch, switchValue, onSwitchChange }: any) => (
    <TouchableOpacity 
      style={[styles.row, { borderBottomColor: theme.colors.divider }]} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon size={20} color={theme.colors.primary} />
        </View>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      </View>
      
      {isSwitch ? (
        <Switch 
          value={switchValue} 
          onValueChange={onSwitchChange}
          trackColor={{ false: '#767577', true: theme.colors.primary }}
        />
      ) : (
        <View style={styles.rowRight}>
          <Text style={{ color: theme.colors.tabBarInactive, marginRight: 8 }}>{value}</Text>
          <ChevronRight size={18} color={theme.colors.divider} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('settings')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section - Editable Name & No Email */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
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
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {userName}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              Tap name to edit profile
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
             <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
               {isEditing ? 'Done' : 'Edit'}
             </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>APPEARANCE</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
          <SettingRow 
            icon={Moon} 
            label="Dark Mode" 
            isSwitch 
            switchValue={isDark} 
            onSwitchChange={toggleTheme} 
          />
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
          <SettingRow 
            icon={Globe} 
            label="App Language" 
            value={language === 'en' ? 'English' : 'العربية'}
            onPress={() => setLanguage(language === 'en' ? 'ar' : 'en')} 
          />
        </View>

        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
          <SettingRow icon={ShieldCheck} label="Privacy Policy" />
          <SettingRow icon={Info} label="App Version" value="1.0.4" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8b949e', marginBottom: 8, marginTop: 24, marginLeft: 4 },
  section: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { padding: 8, borderRadius: 8 },
  label: { fontSize: 16, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#58A6B0', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
});