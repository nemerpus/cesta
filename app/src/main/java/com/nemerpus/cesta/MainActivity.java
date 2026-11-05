package com.nemerpus.cesta;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * Contenedor nativo de la interfaz web (carpeta /web, empaquetada como assets).
 * Sirve los assets desde un origen https propio para que localStorage y las fuentes
 * funcionen igual que en un navegador, y dibuja la app de borde a borde.
 */
public class MainActivity extends Activity {

    private static final String HOST = "cesta.local";
    private static final String START_URL = "https://" + HOST + "/index.html";

    private FrameLayout root;
    private WebView web;
    private int insetTop, insetBottom;
    private boolean keyboardOpen;

    private static final int REQ_PHOTO = 7;
    private ValueCallback<Uri[]> photoCallback;
    private Uri cameraUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        applyColors();
        setupEdgeToEdge();
        setupWebView();

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(START_URL);
        }
    }

    private void setupWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true); // fotos de la cámara/galería (content://)
        s.setUserAgentString(s.getUserAgentString() + " CestaAndroid/1.0");
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                return openPhotoChooser(callback);
            }
        });

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (!HOST.equals(url.getHost())) return null;
                String path = url.getPath();
                if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    String mime = mimeFor(path);
                    return new WebResourceResponse(mime, mime.startsWith("font/") || mime.startsWith("image/png") ? null : "utf-8", in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOST.equals(url.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, url)); } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pushInsetsToPage();
            }
        });
    }

    private static String mimeFor(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".webmanifest") || p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    /* ---------- Foto del ticket: cámara o galería ---------- */

    private boolean openPhotoChooser(ValueCallback<Uri[]> callback) {
        if (photoCallback != null) photoCallback.onReceiveValue(null);
        photoCallback = callback;

        cameraUri = PhotoProvider.newPhotoUri(this);
        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
        camera.setClipData(ClipData.newRawUri("", cameraUri));
        camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Intent gallery = new Intent(Intent.ACTION_GET_CONTENT);
        gallery.addCategory(Intent.CATEGORY_OPENABLE);
        gallery.setType("image/*");

        Intent chooser = Intent.createChooser(gallery, "Foto del ticket");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        try {
            startActivityForResult(chooser, REQ_PHOTO);
            return true;
        } catch (Exception e) {
            photoCallback = null;
            callback.onReceiveValue(null);
            return false;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQ_PHOTO) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        if (photoCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getData() != null) result = new Uri[]{data.getData()};
            else if (cameraUri != null && PhotoProvider.hasContent(this, cameraUri)) result = new Uri[]{cameraUri};
        }
        photoCallback.onReceiveValue(result);
        photoCallback = null;
    }

    /* ---------- Barras del sistema y teclado ---------- */

    private boolean isNight() {
        return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }

    @SuppressWarnings("deprecation")
    private void applyColors() {
        int paper = getColor(R.color.paper);
        root.setBackgroundColor(paper);
        web.setBackgroundColor(paper);
        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Sin velo de contraste: la barra de pestañas de la web ya pinta su fondo bajo los botones.
            w.setNavigationBarContrastEnforced(false);
            w.setStatusBarContrastEnforced(false);
        }
        boolean light = !isNight();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(light ? mask : 0, mask);
            }
        } else {
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            if (light) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            w.getDecorView().setSystemUiVisibility(flags);
        }
    }

    @SuppressWarnings("deprecation")
    private void setupEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left, top, right, bottom, ime;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                Insets kb = insets.getInsets(WindowInsets.Type.ime());
                left = bars.left; top = bars.top; right = bars.right; bottom = bars.bottom;
                ime = kb.bottom;
            } else {
                left = insets.getSystemWindowInsetLeft();
                top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight();
                int sys = insets.getSystemWindowInsetBottom();
                // En Android < 11 el inset inferior incluye el teclado cuando está abierto.
                boolean kbOpen = sys > dp(120);
                bottom = kbOpen ? 0 : sys;
                ime = kbOpen ? sys : 0;
            }
            keyboardOpen = ime > 0;
            // La web se dibuja bajo las barras (ella misma deja el hueco); sólo
            // encogemos la vista cuando aparece el teclado.
            v.setPadding(left, 0, right, ime);
            insetTop = top;
            insetBottom = keyboardOpen ? 0 : bottom;
            pushInsetsToPage();
            return WindowInsets.CONSUMED;
        });
        root.requestApplyInsets();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void pushInsetsToPage() {
        if (web == null) return;
        float d = getResources().getDisplayMetrics().density;
        String js = String.format(Locale.ROOT,
                "(function(r){r.style.setProperty('--inset-t','%.1fpx');r.style.setProperty('--inset-b','%.1fpx');r.classList.toggle('kb',%b);r.classList.add('native');})(document.documentElement)",
                insetTop / d, insetBottom / d, keyboardOpen);
        web.evaluateJavascript(js, null);
    }

    /* ---------- Ciclo de vida ---------- */

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.cestaBack ? cestaBack() : false", handled -> {
            if (!"true".equals(handled)) finish();
        });
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyColors();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        root.removeView(web);
        web.destroy();
        super.onDestroy();
    }
}
