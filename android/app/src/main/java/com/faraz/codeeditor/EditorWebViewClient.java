package com.faraz.codeeditor;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.Nullable;

public class EditorWebViewClient extends WebViewClient {
    
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        // Handle custom URL schemes
        String url = request.getUrl().toString();
        
        if (url.startsWith("faraz-editor://")) {
            // Handle custom scheme
            return true;
        }
        
        return false;
    }
    
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        
        // Inject JavaScript for better mobile experience
        String js = "if (typeof monaco !== 'undefined') {" +
                    "   monaco.editor.defineTheme('mobile-dark', {" +
                    "       base: 'vs-dark'," +
                    "       inherit: true," +
                    "       rules: []," +
                    "       colors: {" +
                    "           'editor.background': '#1e1e1e'" +
                    "       }" +
                    "   });" +
                    "   monaco.editor.setTheme('mobile-dark');" +
                    "}";
        view.evaluateJavascript(js, null);
    }
    
    @Nullable
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        // Add CORS headers for Monaco Editor
        String url = request.getUrl().toString();
        
        if (url.contains("cdn.jsdelivr.net")) {
            // Allow Monaco Editor resources
            return super.shouldInterceptRequest(view, request);
        }
        
        return super.shouldInterceptRequest(view, request);
    }
}
