package id.paradym.authtab

import android.net.Uri
import androidx.browser.auth.AuthTabIntent
import androidx.browser.customtabs.CustomTabsClient
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val AUTH_TAB_REQUEST_CODE = 4281

// Chrome's Auth Tab returns the redirect to the app itself, verified with Digital Asset Links.
// https://developer.chrome.com/docs/android/custom-tabs/guide-auth-tab
class AuthTabModule : Module() {
  private var pendingPromise: Promise? = null

  private fun authTabBrowserPackage(): String? {
    val context = appContext.reactContext ?: return null
    val browserPackage = CustomTabsClient.getPackageName(context, null) ?: return null
    return browserPackage.takeIf { CustomTabsClient.isAuthTabSupported(context, it) }
  }

  override fun definition() = ModuleDefinition {
    Name("AuthTab")

    Function("isSupported") { authTabBrowserPackage() != null }

    AsyncFunction("openAsync") { url: String, redirectUrl: String, promise: Promise ->
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      val redirect = Uri.parse(redirectUrl)
      val intent = AuthTabIntent.Builder().build().intent.apply {
        data = Uri.parse(url)
        setPackage(authTabBrowserPackage())
        if (redirect.scheme == "https") {
          putExtra(AuthTabIntent.EXTRA_HTTPS_REDIRECT_HOST, redirect.host)
          putExtra(AuthTabIntent.EXTRA_HTTPS_REDIRECT_PATH, redirect.path)
        } else {
          putExtra(AuthTabIntent.EXTRA_REDIRECT_SCHEME, redirect.scheme)
        }
      }

      pendingPromise = promise
      activity.startActivityForResult(intent, AUTH_TAB_REQUEST_CODE)
    }.runOnQueue(Queues.MAIN)

    OnActivityResult { _, payload ->
      if (payload.requestCode != AUTH_TAB_REQUEST_CODE) return@OnActivityResult
      val promise = pendingPromise ?: return@OnActivityResult
      pendingPromise = null

      val resultUrl = payload.data?.data
      promise.resolve(
        when {
          payload.resultCode == AuthTabIntent.RESULT_OK && resultUrl != null ->
            mapOf("type" to "success", "url" to resultUrl.toString())
          payload.resultCode == AuthTabIntent.RESULT_VERIFICATION_FAILED ||
            payload.resultCode == AuthTabIntent.RESULT_VERIFICATION_TIMED_OUT -> mapOf("type" to "verification_failed")
          else -> mapOf("type" to "cancel")
        }
      )
    }
  }
}
