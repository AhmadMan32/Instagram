const fs = require("node:fs/promises");
const path = require("node:path");
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require("expo/config-plugins");

const nativeFiles = [
  "NotificationArchiveModule.kt",
  "NotificationArchivePackage.kt",
  "InstagramNotificationListenerService.kt",
];

function withNotificationArchive(config) {
  const packageName = config.android?.package;
  if (!packageName) {
    throw new Error("Set android.package before enabling Notification Archive.");
  }

  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error("Android manifest is missing its application element.");
    }

    application.service ??= [];
    const serviceName = ".InstagramNotificationListenerService";
    const alreadyAdded = application.service.some(
      (service) => service.$?.["android:name"] === serviceName,
    );

    if (!alreadyAdded) {
      application.service.push({
        $: {
          "android:name": serviceName,
          "android:label": "Insta Bildirim Arşivi",
          "android:exported": "true",
          "android:permission":
            "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "android.service.notification.NotificationListenerService",
                },
              },
            ],
          },
        ],
      });
    }

    return mod;
  });

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    const registration = /PackageList\(this\)\.packages\.apply\s*\{/;

    if (!contents.includes("NotificationArchivePackage()")) {
      if (!registration.test(contents)) {
        throw new Error(
          "Could not find the Android package list to register Notification Archive.",
        );
      }
      contents = contents.replace(
        registration,
        (match) =>
          `${match}\n          add(${packageName}.NotificationArchivePackage())`,
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

  config = withDangerousMod(config, [
    "android",
    async (mod) => {
      const sourceDirectory = path.join(
        mod.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...packageName.split("."),
      );
      await fs.mkdir(sourceDirectory, { recursive: true });

      for (const fileName of nativeFiles) {
        const sourcePath = path.join(__dirname, "android", fileName);
        const destinationPath = path.join(sourceDirectory, fileName);
        const source = await fs.readFile(sourcePath, "utf8");
        await fs.writeFile(
          destinationPath,
          source.replaceAll("__ANDROID_PACKAGE__", packageName),
          "utf8",
        );
      }

      return mod;
    },
  ]);

  return config;
}

module.exports = withNotificationArchive;
