# Add project specific ProGuard rules here.

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# Monaco Editor WebView
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
    public *;
}

# General
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.faraz.codeeditor.** { *; }
