import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useArchive, type AccountProfile } from "@/context/ArchiveContext";

function normalizeIdentifier(identifier: string) {
  return identifier
    .trim()
    .replace(/^@/, "")
    .toLocaleLowerCase("tr-TR");
}

export default function AccountsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    entries,
    profiles,
    addProfile,
    removeProfile,
    clearArchive,
    storageError,
  } = useArchive();
  const [label, setLabel] = useState("");
  const [handle, setHandle] = useState("");
  const [matchTerm, setMatchTerm] = useState("");

  const entryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.accountId) {
        counts.set(entry.accountId, (counts.get(entry.accountId) ?? 0) + 1);
      }
    }
    return counts;
  }, [entries]);

  const saveProfile = async () => {
    const nextLabel = label.trim();
    const nextHandle = handle.trim();
    if (!nextLabel || !nextHandle) {
      Alert.alert(
        "Bilgileri tamamla",
        "Hesap etiketi ve kullanıcı adı veya ID alanları gerekli.",
      );
      return;
    }
    if (
      profiles.some(
        (profile) =>
          normalizeIdentifier(profile.handle) ===
          normalizeIdentifier(nextHandle),
      )
    ) {
      Alert.alert("Hesap zaten ekli", "Bu kullanıcı adı veya ID listede var.");
      return;
    }

    await addProfile({
      label: nextLabel,
      handle: nextHandle,
      matchTerm: matchTerm.trim(),
    });
    setLabel("");
    setHandle("");
    setMatchTerm("");
    Keyboard.dismiss();
  };

  const confirmRemoveProfile = (profile: AccountProfile) => {
    Alert.alert(
      "Etiketi kaldır?",
      `${profile.label} etiketi kaldırılır. İlişkili kayıtlar “Atanmamış” olur.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: () => void removeProfile(profile.id),
        },
      ],
    );
  };

  const confirmClearArchive = () => {
    Alert.alert(
      "Arşivdeki her şey silinsin mi?",
      "Bu cihazdaki tüm kayıtlar kalıcı olarak kaldırılır. Hesap etiketleri silinmez.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Arşivi temizle",
          style: "destructive",
          onPress: () => void clearArchive(),
        },
      ],
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 30),
        },
      ]}
      bottomOffset={28}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        YEREL ETİKETLER
      </Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Hesaplar
      </Text>
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        Instagram hesaplarını kendi adlarınla listele. Bunlar giriş bilgisi
        değildir; sadece arşiv kayıtlarını ayırmak için kullanılır.
      </Text>

      <View
        style={[
          styles.notice,
          { backgroundColor: colors.secondary },
        ]}
      >
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.secondaryForeground }]}>
          Bildirim metninde hesap adı/ID veya eşleşme sözü görünürse otomatik
          etiket atanır. Birden fazla etiket eşleşirse ya da Android hesabı
          belirtmezse kaydı Arşiv ekranında elle etiketleyebilirsin.
        </Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Ekli hesaplar
        </Text>
        <Text style={[styles.countText, { color: colors.mutedForeground }]}>
          {profiles.length}
        </Text>
      </View>

      {profiles.length > 0 ? (
        <View style={styles.profileList}>
          {profiles.map((profile) => (
            <View
              key={profile.id}
              style={[
                styles.profileCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.profileIcon,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Feather
                  name="user"
                  size={17}
                  color={colors.accentForeground}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text
                  numberOfLines={1}
                  style={[styles.profileLabel, { color: colors.foreground }]}
                >
                  {profile.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.profileHandle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {profile.handle}
                  {profile.matchTerm ? ` · ${profile.matchTerm}` : ""}
                </Text>
                <Text
                  style={[
                    styles.profileCount,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {entryCounts.get(profile.id) ?? 0} kayıt
                </Text>
              </View>
              <Pressable
                onPress={() => confirmRemoveProfile(profile)}
                accessibilityRole="button"
                accessibilityLabel={`${profile.label} etiketini kaldır`}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name="trash-2"
                  size={16}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.emptyAccounts,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="users" size={19} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Henüz hesap etiketi eklemedin.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.formTitle, { color: colors.foreground }]}>
          Hesap etiketi ekle
        </Text>
        <Text style={[styles.formDescription, { color: colors.mutedForeground }]}>
          Hesap kimliğini yalnızca yerel olarak saklanan bir ad ve kullanıcı
          adı olarak kaydet.
        </Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Örnek: Mağaza hesabı"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="sentences"
          returnKeyType="next"
          accessibilityLabel="Hesap etiketi"
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.input,
              backgroundColor: colors.background,
            },
          ]}
        />
        <TextInput
          value={handle}
          onChangeText={setHandle}
          placeholder="Kullanıcı adı (@ ile) veya hesap ID'si"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel="Kullanıcı adı veya hesap kimliği"
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.input,
              backgroundColor: colors.background,
            },
          ]}
        />
        <TextInput
          value={matchTerm}
          onChangeText={setMatchTerm}
          placeholder="Eşleşme sözü (isteğe bağlı)"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel="Bildirimin içinde aranacak hesap sözü"
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.input,
              backgroundColor: colors.background,
            },
          ]}
        />
        <Pressable
          onPress={() => void saveProfile()}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Feather name="plus" size={17} color={colors.primaryForeground} />
          <Text
            style={[styles.addButtonText, { color: colors.primaryForeground }]}
          >
            Hesap ekle
          </Text>
        </Pressable>
      </View>

      {storageError ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {storageError}
        </Text>
      ) : null}

      <View
        style={[
          styles.privacyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.privacyHeading}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.privacyTitle, { color: colors.foreground }]}>
            Cihazda kalır
          </Text>
        </View>
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
          Bildirim metinleri, hesap etiketleri ve kayıtlar bu telefonda tutulur.
          Uygulama Instagram’a giriş yapmaz ve başka uygulamaların bildirim
          içeriklerini arşive eklemez.
        </Text>
      </View>

      <Pressable
        onPress={confirmClearArchive}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.clearButton,
          { borderColor: colors.destructive },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="trash-2" size={16} color={colors.destructive} />
        <Text style={[styles.clearButtonText, { color: colors.destructive }]}>
          Tüm arşivi temizle
        </Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  intro: { fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 16 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 13,
    borderRadius: 16,
    marginBottom: 23,
  },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 11,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  countText: { fontSize: 12, fontWeight: "600" },
  profileList: { gap: 9, marginBottom: 18 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 17,
    borderWidth: 1,
    gap: 11,
  },
  profileIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1 },
  profileLabel: { fontSize: 13, fontWeight: "700" },
  profileHandle: { fontSize: 11, marginTop: 2 },
  profileCount: { fontSize: 10, marginTop: 3 },
  removeButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAccounts: {
    minHeight: 77,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginBottom: 18,
  },
  emptyText: { fontSize: 12 },
  formCard: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 17,
  },
  formTitle: { fontSize: 15, fontWeight: "700" },
  formDescription: { fontSize: 11, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  input: {
    minHeight: 45,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    fontSize: 12,
    marginBottom: 9,
  },
  addButton: {
    minHeight: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 2,
  },
  addButtonText: { fontSize: 12, fontWeight: "700" },
  errorText: { fontSize: 12, marginBottom: 12 },
  privacyCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  privacyHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  privacyTitle: { fontSize: 12, fontWeight: "700" },
  privacyText: { fontSize: 11, lineHeight: 17 },
  clearButton: {
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearButtonText: { fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.72 },
});
