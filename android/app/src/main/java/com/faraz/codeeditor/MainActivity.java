package com.faraz.codeeditor;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.content.pm.ActivityInfo;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install splash screen
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        
        // Keep screen on while coding
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Allow all orientations
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
        
        // Initialize plugins if needed
        // this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        //    add(FileAccessPlugin.class);
        // }});
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Configure WebView settings
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable JavaScript
            settings.setJavaScriptEnabled(true);
            
            // Enable DOM storage for Monaco Editor
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            
            // Enable file access
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            
            // Improve performance
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Enable zoom controls
            settings.setBuiltInZoomControls(true);
            settings.setDisplayZoomControls(false);
            
            // Set WebView client
            webView.setWebViewClient(new EditorWebViewClient());
            webView.setWebChromeClient(new EditorWebChromeClient());
        }
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Handle back button
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            WebView webView = getBridge().getWebView();
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        // Resume WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
        }
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        
        // Pause WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onPause();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // Clean up WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.destroy();
        }
    }
}
