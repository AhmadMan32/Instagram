import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useArchive, type AccountProfile, type ArchiveEntry } from "@/context/ArchiveContext";

type FilterId = "all" | "unassigned" | string;

function timeLabel(timestamp: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return isToday
    ? `Bugün · ${time}`
    : `${date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      })} · ${time}`;
}

function NotificationCard({
  entry,
  profiles,
  expanded,
  onToggle,
  onAssign,
  onDelete,
}: {
  entry: ArchiveEntry;
  profiles: AccountProfile[];
  expanded: boolean;
  onToggle: () => void;
  onAssign: (profileId: string | null) => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const assignedProfile = profiles.find(
    (profile) => profile.id === entry.accountId,
  );

  return (
    <View
      style={[
        styles.entryCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${entry.title || "Instagram bildirimi"} kaydını ${
          expanded ? "daralt" : "genişlet"
        }`}
        style={({ pressed }) => [
          styles.entryPressArea,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.entryTopRow}>
          <View
            style={[
              styles.entryIcon,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="message-circle" size={17} color={colors.primary} />
          </View>
          <View style={styles.entryHeading}>
            <Text
              numberOfLines={1}
              style={[styles.entryTitle, { color: colors.foreground }]}
            >
              {entry.title || "Instagram bildirimi"}
            </Text>
            <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>
              {timeLabel(entry.receivedAt)}
            </Text>
          </View>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
        {entry.body ? (
          <Text
            numberOfLines={expanded ? undefined : 4}
            style={[styles.entryBody, { color: colors.foreground }]}
          >
            {entry.body}
          </Text>
        ) : null}
        <View style={styles.entryMetaRow}>
          {assignedProfile ? (
            <View
              style={[
                styles.accountPill,
                { backgroundColor: colors.secondary },
              ]}
            >
              <View
                style={[styles.accountDot, { backgroundColor: colors.primary }]}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.accountPillText,
                  { color: colors.secondaryForeground },
                ]}
              >
                {assignedProfile.label}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.accountPill,
                { backgroundColor: colors.muted },
              ]}
            >
              <Feather
                name="help-circle"
                size={12}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.accountPillText,
                  { color: colors.mutedForeground },
                ]}
              >
                Atanmamış
              </Text>
            </View>
          )}
          {entry.accountHint ? (
            <Text
              numberOfLines={1}
              style={[styles.accountHint, { color: colors.mutedForeground }]}
            >
              {entry.accountHint}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {expanded ? (
        <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
          {profiles.length > 0 ? (
            <>
              <Text
                style={[
                  styles.expandedLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Hesap etiketi
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.assignmentList}
              >
                <Pressable
                  onPress={() => onAssign(null)}
                  accessibilityRole="button"
                  style={[
                    styles.assignmentChip,
                    {
                      borderColor:
                        entry.accountId === null
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        entry.accountId === null
                          ? colors.secondary
                          : colors.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.assignmentText,
                      {
                        color:
                          entry.accountId === null
                            ? colors.primary
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    Atanmamış
                  </Text>
                </Pressable>
                {profiles.map((profile) => (
                  <Pressable
                    key={profile.id}
                    onPress={() => onAssign(profile.id)}
                    accessibilityRole="button"
                    style={[
                      styles.assignmentChip,
                      {
                        borderColor:
                          entry.accountId === profile.id
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          entry.accountId === profile.id
                            ? colors.secondary
                            : colors.card,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.assignmentText,
                        {
                          color:
                            entry.accountId === profile.id
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {profile.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text
              style={[
                styles.expandedHint,
                { color: colors.mutedForeground },
              ]}
            >
              Hesap eklediğinde bu kaydı buradan etiketleyebilirsin.
            </Text>
          )}
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Bu arşiv kaydını sil"
            style={({ pressed }) => [
              styles.deleteEntryButton,
              pressed && styles.pressed,
            ]}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
            <Text
              style={[
                styles.deleteEntryText,
                { color: colors.destructive },
              ]}
            >
              Kaydı sil
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function ArchiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    entries,
    profiles,
    nativeAvailable,
    hasAccess,
    captureEnabled,
    loading,
    storageError,
    refresh,
    assignEntry,
    removeEntry,
    openNotificationSettings,
    setCaptureEnabled,
  } = useArchive();

  const [search, setSearch] = useState("");
  const [filterId, setFilterId] = useState<FilterId>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
    return entries.filter((entry) => {
      const matchesFilter =
        filterId === "all"
          ? true
          : filterId === "unassigned"
            ? entry.accountId === null
            : entry.accountId === filterId;
      const searchableText =
        `${entry.title}\n${entry.accountHint}\n${entry.body}`.toLocaleLowerCase(
          "tr-TR",
        );
      return matchesFilter && searchableText.includes(normalizedSearch);
    });
  }, [entries, filterId, search]);

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert("Kaydı sil?", "Bu bildirim arşivden kaldırılır.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          void removeEntry(entryId);
          if (expandedId === entryId) setExpandedId(null);
        },
      },
    ]);
  };

  const handleOpenSettings = async () => {
    const opened = await openNotificationSettings();
    if (!opened) {
      Alert.alert(
        "Android derlemesi gerekli",
        "Bildirim erişimi, Android özel derlemesinde açılabilir. Expo Go ve web önizlemesi özel bildirim dinleyicisini içermez.",
      );
    }
  };

  const handleToggleCapture = async (enabled: boolean) => {
    const updated = await setCaptureEnabled(enabled);
    if (!updated) {
      Alert.alert(
        "Bildirim erişimi gerekli",
        "Önce Android ayarlarından bu uygulama için bildirim erişimini aç.",
      );
    }
  };

  const listHeader = (
    <View>
      <View
        style={[
          styles.pageHeader,
          { paddingTop: Platform.OS === "web" ? 67 : 10 },
        ]}
      >
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            YALNIZCA BU CİHAZDA
          </Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Arşiv
          </Text>
        </View>
        <View
          style={[
            styles.totalBadge,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Text style={[styles.totalNumber, { color: colors.primary }]}>
            {entries.length}
          </Text>
          <Text
            style={[
              styles.totalCaption,
              { color: colors.secondaryForeground },
            ]}
          >
            kayıt
          </Text>
        </View>
      </View>

      {!nativeAvailable ? (
        <View
          style={[
            styles.permissionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.permissionIcon,
              { backgroundColor: colors.accent },
            ]}
          >
            <Feather name="smartphone" size={18} color={colors.accentForeground} />
          </View>
          <View style={styles.permissionCopy}>
            <Text
              style={[
                styles.permissionTitle,
                { color: colors.foreground },
              ]}
            >
              Android özel derlemesi gerekli
            </Text>
            <Text
              style={[
                styles.permissionDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Bildirim yakalama, Expo Go’da ve web önizlemesinde çalışmaz.
              Özel Android derlemesi yüklendiğinde izin ayarları burada açılır.
            </Text>
          </View>
        </View>
      ) : !hasAccess ? (
        <View
          style={[
            styles.permissionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.permissionIcon,
              { backgroundColor: colors.accent },
            ]}
          >
            <Feather
              name="bell"
              size={18}
              color={colors.accentForeground}
            />
          </View>
          <View style={styles.permissionCopy}>
            <Text
              style={[
                styles.permissionTitle,
                { color: colors.foreground },
              ]}
            >
              Bildirim erişimini aç
            </Text>
            <Text
              style={[
                styles.permissionDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Android ayarlarından izin verdiğinde, yalnızca Instagram
              bildirimlerinde gösterilen metinler bu telefona kaydedilir.
            </Text>
            <Pressable
              onPress={() => void handleOpenSettings()}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Feather name="external-link" size={15} color={colors.primaryForeground} />
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Android ayarlarını aç
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.activeCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.activeIcon,
              {
                backgroundColor: captureEnabled
                  ? colors.secondary
                  : colors.muted,
              },
            ]}
          >
            <Feather
              name={captureEnabled ? "check" : "pause"}
              size={17}
              color={captureEnabled ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={styles.permissionCopy}>
            <Text
              style={[
                styles.permissionTitle,
                { color: colors.foreground },
              ]}
            >
              {captureEnabled ? "Arşivleme açık" : "Arşivleme duraklatıldı"}
            </Text>
            <Text
              style={[
                styles.permissionDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Yalnızca com.instagram.android bildirimleri saklanır. Fotoğraf
              veya video dosyaları alınmaz.
            </Text>
          </View>
          <Switch
            value={captureEnabled}
            onValueChange={(value) => void handleToggleCapture(value)}
            trackColor={{
              false: colors.border,
              true: colors.primary,
            }}
            thumbColor={colors.card}
            accessibilityLabel="Bildirim arşivlemeyi aç veya duraklat"
          />
        </View>
      )}

      {storageError ? (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: colors.destructiveForeground },
          ]}
        >
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {storageError}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Bildirimlerde ara"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Arşivde ara"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 ? (
          <Pressable
            onPress={() => setSearch("")}
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
            hitSlop={8}
          >
            <Feather name="x-circle" size={17} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {[
          { id: "all" as const, label: "Tümü" },
          { id: "unassigned" as const, label: "Atanmamış" },
          ...profiles.map((profile) => ({
            id: profile.id,
            label: profile.label,
          })),
        ].map((filter) => {
          const selected = filterId === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setFilterId(filter.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? colors.foreground : colors.card,
                  borderColor: selected ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.filterText,
                  {
                    color: selected
                      ? colors.background
                      : colors.mutedForeground,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHeading}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Son bildirimler
        </Text>
        <Pressable
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Arşivi yenile"
          hitSlop={10}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
        >
          <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );

  const emptyContent = (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: colors.secondary },
        ]}
      >
        <Feather name="inbox" size={23} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {search || filterId !== "all"
          ? "Eşleşen bildirim bulunamadı"
          : "Henüz kayıt yok"}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {search || filterId !== "all"
          ? "Arama sözcüğünü veya hesap filtresini değiştir."
          : "Erişim iznini açtıktan sonra Instagram bildirim önizlemeleri burada görünür."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardContainer}
      >
        <FlatList
          data={filteredEntries}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item }) => (
            <NotificationCard
              entry={item}
              profiles={profiles}
              expanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              onAssign={(profileId) => void assignEntry(item.id, profileId)}
              onDelete={() => handleDeleteEntry(item.id)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyContent}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 18),
            },
          ]}
          ItemSeparatorComponent={() => <View style={styles.entryGap} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardContainer: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 19,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  totalBadge: {
    minWidth: 68,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: "center",
  },
  totalNumber: { fontSize: 18, lineHeight: 21, fontWeight: "700" },
  totalCaption: { fontSize: 10, fontWeight: "600", marginTop: 1 },
  permissionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 17,
    gap: 12,
  },
  permissionIcon: {
    height: 38,
    width: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionCopy: { flex: 1 },
  permissionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    marginTop: 13,
  },
  primaryButtonText: { fontSize: 12, fontWeight: "700" },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 17,
    gap: 11,
  },
  activeIcon: {
    height: 36,
    width: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 11,
    gap: 8,
    marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 15,
    gap: 10,
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterList: {
    gap: 8,
    paddingBottom: 20,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 150,
  },
  filterText: { fontSize: 11, fontWeight: "600" },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  refreshButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  entryPressArea: { padding: 14 },
  entryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  entryIcon: {
    height: 35,
    width: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  entryHeading: { flex: 1 },
  entryTitle: { fontSize: 14, lineHeight: 19, fontWeight: "700" },
  entryTime: { fontSize: 10, marginTop: 2 },
  entryBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  entryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  accountPill: {
    maxWidth: 150,
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 99,
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  accountDot: { width: 6, height: 6, borderRadius: 3 },
  accountPillText: { fontSize: 10, fontWeight: "600" },
  accountHint: { flex: 1, fontSize: 10 },
  expandedArea: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expandedLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  assignmentList: { gap: 7, paddingRight: 8, paddingBottom: 2 },
  assignmentChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 99,
    maxWidth: 150,
  },
  assignmentText: { fontSize: 10, fontWeight: "600" },
  expandedHint: { fontSize: 11, lineHeight: 16, marginBottom: 4 },
  deleteEntryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    marginTop: 6,
  },
  deleteEntryText: { fontSize: 11, fontWeight: "600" },
  entryGap: { height: 10 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 42,
    paddingBottom: 45,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyDescription: {
    maxWidth: 290,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  pressed: { opacity: 0.72 },
});
