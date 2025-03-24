
package com.youtubesubtitles.app

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
        }
        
        webView.webViewClient = WebViewClient()
        webView.loadUrl("https://${BuildConfig.REPL_SLUG}.${BuildConfig.REPL_OWNER}.repl.co")
    }
}
