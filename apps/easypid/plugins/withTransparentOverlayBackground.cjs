const fs = require('node:fs/promises')
const path = require('node:path')
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
} = require('expo/config-plugins')

const { Resources, Styles } = AndroidConfig

const DEEPLINK_PROXY_ACTIVITY = '.DeepLinkProxyActivity'
const DEEPLINK_OVERLAY_ACTIVITY = '.DeepLinkOverlayActivity'
const VIEW_ACTION = 'android.intent.action.VIEW'
const DEFAULT_CATEGORY = 'android.intent.category.DEFAULT'
const BROWSABLE_CATEGORY = 'android.intent.category.BROWSABLE'
const EXPO_DEV_SCHEME_PREFIX = 'exp+'
const PROXY_DEEPLINK_SCHEMES = new Set([
  'openid',
  'openid-initiate-issuance',
  'openid-credential-offer',
  'openid-vc',
  'openid4vp',
  'eudi-openid4vp',
  'mdoc-openid4vp',
  'haip',
])

const DEV_LAUNCHER_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <application
        android:networkSecurityConfig="@xml/dev_client_network_security_config"
        tools:replace="android:networkSecurityConfig">
        <activity
            android:name="expo.modules.devlauncher.launcher.DevLauncherActivity"
            android:theme="@style/Theme.Paradym.DevLauncher"
            tools:replace="android:theme" />
    </application>
</manifest>
`

const DEV_CLIENT_NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
`

function setStyleItem(xml, parent, name, value) {
  return Styles.setStylesItem({
    xml,
    parent,
    item: Resources.buildResourceItem({ name, value }),
  })
}

function withTransparentAndroidStyles(config) {
  return withAndroidStyles(config, (config) => {
    let xml = config.modResults
    const splashTheme = { name: 'Theme.App.SplashScreen' }
    const devLauncherTheme = { name: 'Theme.Paradym.DevLauncher', parent: 'Theme.AppCompat.DayNight.NoActionBar' }
    const overlayTheme = { name: 'Theme.Paradym.DeepLinkOverlay', parent: 'Theme.AppCompat.DayNight.NoActionBar' }

    for (const [parent, name, value] of [
      [Styles.getAppThemeGroup(), 'android:windowBackground', '@android:color/white'],
      [Styles.getAppThemeGroup(), 'android:windowIsTranslucent', 'false'],
      [splashTheme, 'windowSplashScreenBackground', '#F2F4F6'],
      [splashTheme, 'android:windowBackground', '#F2F4F6'],
      [splashTheme, 'android:windowIsTranslucent', 'false'],
      [devLauncherTheme, 'android:windowBackground', '@android:color/white'],
      [devLauncherTheme, 'android:windowIsTranslucent', 'false'],
      [overlayTheme, 'android:windowBackground', '@android:color/transparent'],
      [overlayTheme, 'android:windowIsTranslucent', 'true'],
      [overlayTheme, 'android:windowAnimationStyle', '@android:style/Animation'],
      [overlayTheme, 'android:backgroundDimEnabled', 'false'],
    ]) {
      xml = setStyleItem(xml, parent, name, value)
    }

    config.modResults = xml
    return config
  })
}

function getApplicationOrThrow(manifest) {
  const application = manifest?.manifest?.application?.[0]
  if (!application) throw new Error('Could not find Android application in manifest')

  application.activity = application.activity ?? []
  return application
}

function hasCategory(filter, categoryName) {
  return (filter.category ?? []).some((category) => category.$?.['android:name'] === categoryName)
}

function hasAction(filter, actionName) {
  return (filter.action ?? []).some((action) => action.$?.['android:name'] === actionName)
}

function isBrowsableViewIntentFilter(filter) {
  return (
    hasAction(filter, VIEW_ACTION) && hasCategory(filter, DEFAULT_CATEGORY) && hasCategory(filter, BROWSABLE_CATEGORY)
  )
}

function shouldMoveDataItemToProxy(dataItem, appScheme) {
  const scheme = dataItem.$?.['android:scheme']

  if (!scheme) return false
  if (scheme.startsWith(EXPO_DEV_SCHEME_PREFIX)) return false
  if (scheme === appScheme) return true
  return PROXY_DEEPLINK_SCHEMES.has(scheme)
}

function cloneIntentFilter(filter, data) {
  return { ...filter, data }
}

function buildProxyActivity(proxyFilters) {
  return {
    $: {
      'android:name': DEEPLINK_PROXY_ACTIVITY,
      'android:configChanges':
        'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|locale|layoutDirection',
      'android:excludeFromRecents': 'true',
      'android:exported': 'true',
      'android:launchMode': 'singleTask',
      'android:noHistory': 'true',
      'android:taskAffinity': '',
      'android:theme': '@android:style/Theme.NoDisplay',
    },
    'intent-filter': proxyFilters,
  }
}

function buildOverlayActivity(packageName) {
  return {
    $: {
      'android:name': DEEPLINK_OVERLAY_ACTIVITY,
      'android:configChanges':
        'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|locale|layoutDirection',
      'android:excludeFromRecents': 'true',
      'android:exported': 'false',
      'android:launchMode': 'standard',
      'android:screenOrientation': 'portrait',
      'android:taskAffinity': `${packageName}.deeplinkOverlay`,
      'android:theme': '@style/Theme.Paradym.DeepLinkOverlay',
      'android:windowSoftInputMode': 'adjustResize',
    },
  }
}

function withAndroidDeepLinkActivities(config) {
  return withAndroidManifest(config, (config) => {
    const application = getApplicationOrThrow(config.modResults)
    const packageName = config.android?.package ?? application.$?.['android:name'] ?? 'app'
    const activities = application.activity ?? []
    const mainActivity = activities.find((activity) => activity.$?.['android:name'] === '.MainActivity')

    if (!mainActivity) throw new Error('Could not find MainActivity in AndroidManifest.xml')

    const retainedFilters = []
    const proxyFilters = []

    for (const filter of mainActivity['intent-filter'] ?? []) {
      if (!isBrowsableViewIntentFilter(filter)) {
        retainedFilters.push(filter)
        continue
      }

      const dataItems = filter.data ?? []
      const proxyData = dataItems.filter((item) => shouldMoveDataItemToProxy(item, config.scheme))
      const mainData = dataItems.filter((item) => !shouldMoveDataItemToProxy(item, config.scheme))

      if (mainData.length > 0) retainedFilters.push(cloneIntentFilter(filter, mainData))
      if (proxyData.length > 0) proxyFilters.push(cloneIntentFilter(filter, proxyData))
    }

    mainActivity['intent-filter'] = retainedFilters
    application.activity = activities.filter((activity) => {
      const name = activity.$?.['android:name']
      return name !== DEEPLINK_PROXY_ACTIVITY && name !== DEEPLINK_OVERLAY_ACTIVITY
    })

    if (proxyFilters.length > 0) application.activity.push(buildProxyActivity(proxyFilters))
    application.activity.push(buildOverlayActivity(packageName))

    return config
  })
}

function getPackagePath(packageName) {
  return packageName.split('.')
}

function buildDeepLinkProxyActivitySource(packageName) {
  const overlaySchemes = Array.from(PROXY_DEEPLINK_SCHEMES)
    .map((scheme) => `      "${scheme}"`)
    .join(',\n')

  return `package ${packageName}

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class DeepLinkProxyActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    forwardIntent(intent)
    finish()
    overridePendingTransition(0, 0)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    forwardIntent(intent)
    finish()
    overridePendingTransition(0, 0)
  }

  private fun forwardIntent(sourceIntent: Intent?) {
    val url = sourceIntent?.dataString ?: sourceIntent?.getStringExtra(DeepLinkOverlayActivity.EXTRA_INITIAL_URL) ?: return
    val targetActivity =
      if (shouldLaunchOverlay(url) || DeepLinkOverlayActivity.isOverlayTaskActive()) {
        DeepLinkOverlayActivity::class.java
      } else {
        MainActivity::class.java
      }

    val launchIntent =
      Intent(this, targetActivity).apply {
        putExtra(DeepLinkOverlayActivity.EXTRA_INITIAL_URL, url)
        addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)

        if (targetActivity == DeepLinkOverlayActivity::class.java) {
          addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_NEW_DOCUMENT or
              Intent.FLAG_ACTIVITY_MULTIPLE_TASK
          )
        } else {
          action = Intent.ACTION_VIEW
          data = Uri.parse(url)
          addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
      }

    startActivity(launchIntent)
  }

  private fun shouldLaunchOverlay(url: String): Boolean {
    val uri = Uri.parse(url)
    val scheme = uri.scheme ?: return false
    val lowerCasedUrl = url.lowercase()

    return when (scheme) {
${overlaySchemes} -> true
      else ->
        lowerCasedUrl.contains("request_uri=") ||
          lowerCasedUrl.contains("request=") ||
          lowerCasedUrl.contains("credential_offer_uri=") ||
          lowerCasedUrl.contains("credential_offer=")
    }
  }
}
`
}

function buildDeepLinkOverlayActivitySource(packageName) {
  return `package ${packageName}

import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

class DeepLinkOverlayActivity : ReactActivity() {
  companion object {
    const val EXTRA_INITIAL_URL = "deeplinkOverlayInitialUrl"

    @Volatile private var overlayTaskActive = false

    @JvmStatic
    fun isOverlayTaskActive(): Boolean = overlayTaskActive
  }

  override fun getMainComponentName(): String = "DeepLinkOverlayActivity"

  override fun onCreate(savedInstanceState: Bundle?) {
    overlayTaskActive = true
    super.onCreate(null)

    window.apply {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        setDecorFitsSystemWindows(false)
      } else {
        @Suppress("DEPRECATION")
        decorView.systemUiVisibility =
          (View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
      }

      navigationBarColor = Color.TRANSPARENT
      statusBarColor = Color.TRANSPARENT
      setBackgroundDrawableResource(android.R.color.transparent)
    }
  }

  override fun onDestroy() {
    if (isFinishing) overlayTaskActive = false
    super.onDestroy()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  override fun onUserLeaveHint() {
    // ReactActivity can crash on a null delegate while Expo Dev Launcher is opening.
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions() =
          Bundle().apply {
            putString(EXTRA_INITIAL_URL, intent?.dataString ?: intent?.getStringExtra(EXTRA_INITIAL_URL))
          }
      }
    )
  }
}
`
}

function buildDeepLinkOverlayControlModuleSource(packageName) {
  return `package ${packageName}

import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = DeepLinkOverlayControlModule.NAME)
class DeepLinkOverlayControlModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val NAME = "DeepLinkOverlayControl"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun finishOverlayTask() {
    val activity = reactApplicationContext.currentActivity
    if (activity !is DeepLinkOverlayActivity) return

    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        activity.finishAndRemoveTask()
      } else {
        activity.finish()
      }

      activity.overridePendingTransition(0, 0)
    }
  }
}
`
}

function buildDeepLinkOverlayControlPackageSource(packageName) {
  return `package ${packageName}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class DeepLinkOverlayControlPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(DeepLinkOverlayControlModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
`
}

function registerOverlayControlPackage(mainApplicationSource) {
  if (mainApplicationSource.includes('DeepLinkOverlayControlPackage()')) return mainApplicationSource

  return mainApplicationSource.replace(
    'PackageList(this).packages.apply {',
    `PackageList(this).packages.apply {
              add(DeepLinkOverlayControlPackage())`
  )
}

function withDeepLinkActivitySources(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package
      if (!packageName) throw new Error('Android package name required to create deeplink overlay activities')

      const javaRoot = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...getPackagePath(packageName)
      )

      await fs.mkdir(javaRoot, { recursive: true })
      await Promise.all([
        fs.writeFile(path.join(javaRoot, 'DeepLinkProxyActivity.kt'), buildDeepLinkProxyActivitySource(packageName)),
        fs.writeFile(
          path.join(javaRoot, 'DeepLinkOverlayActivity.kt'),
          buildDeepLinkOverlayActivitySource(packageName)
        ),
        fs.writeFile(
          path.join(javaRoot, 'DeepLinkOverlayControlModule.kt'),
          buildDeepLinkOverlayControlModuleSource(packageName)
        ),
        fs.writeFile(
          path.join(javaRoot, 'DeepLinkOverlayControlPackage.kt'),
          buildDeepLinkOverlayControlPackageSource(packageName)
        ),
      ])

      const mainApplicationPath = path.join(javaRoot, 'MainApplication.kt')
      const mainApplicationSource = await fs.readFile(mainApplicationPath, 'utf8')
      const nextMainApplicationSource = registerOverlayControlPackage(mainApplicationSource)

      if (nextMainApplicationSource !== mainApplicationSource) {
        await fs.writeFile(mainApplicationPath, nextMainApplicationSource)
      }

      return config
    },
  ])
}

function withTransparentDevLauncher(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const appRoot = path.join(config.modRequest.platformProjectRoot, 'app', 'src')

      await Promise.all(
        ['debug', 'debugOptimized'].map(async (buildType) => {
          const manifestPath = path.join(appRoot, buildType, 'AndroidManifest.xml')
          const networkSecurityConfigPath = path.join(
            appRoot,
            buildType,
            'res',
            'xml',
            'dev_client_network_security_config.xml'
          )

          await fs.mkdir(path.dirname(manifestPath), { recursive: true })
          await fs.mkdir(path.dirname(networkSecurityConfigPath), { recursive: true })
          await fs.writeFile(manifestPath, DEV_LAUNCHER_MANIFEST)
          await fs.writeFile(networkSecurityConfigPath, DEV_CLIENT_NETWORK_SECURITY_CONFIG)
        })
      )

      return config
    },
  ])
}

const withTransparentOverlayBackground = (config) => {
  config = withTransparentAndroidStyles(config)
  config = withAndroidDeepLinkActivities(config)
  config = withDeepLinkActivitySources(config)
  config = withTransparentDevLauncher(config)
  return config
}

module.exports = createRunOncePlugin(withTransparentOverlayBackground, 'with-transparent-overlay-background', '1.0.0')
