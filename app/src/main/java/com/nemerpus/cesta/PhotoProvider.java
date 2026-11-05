package com.nemerpus.cesta;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Proveedor mínimo para que la app de cámara escriba la foto del ticket en la
 * caché de Cesta (equivalente a FileProvider, sin depender de AndroidX).
 */
public class PhotoProvider extends ContentProvider {

    static final String AUTHORITY = "com.nemerpus.cesta.photos";
    private static final long MAX_AGE_MS = 24L * 60 * 60 * 1000;

    static Uri newPhotoUri(Context context) {
        File dir = dir(context);
        File[] old = dir.listFiles();
        if (old != null) {
            long now = System.currentTimeMillis();
            for (File f : old) if (now - f.lastModified() > MAX_AGE_MS) f.delete();
        }
        return Uri.parse("content://" + AUTHORITY + "/ticket-" + System.currentTimeMillis() + ".jpg");
    }

    static boolean hasContent(Context context, Uri uri) {
        File f = fileFor(context, uri);
        return f != null && f.length() > 0;
    }

    private static File dir(Context context) {
        File d = new File(context.getCacheDir(), "camera");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private static File fileFor(Context context, Uri uri) {
        String name = uri.getLastPathSegment();
        if (name == null || !name.matches("ticket-\\d+\\.jpg")) return null;
        return new File(dir(context), name);
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File f = fileFor(getContext(), uri);
        if (f == null) throw new FileNotFoundException(uri.toString());
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.parseMode(mode));
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File f = fileFor(getContext(), uri);
        if (f == null) return null;
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        c.addRow(new Object[]{f.getName(), f.length()});
        return c;
    }

    @Override
    public String getType(Uri uri) {
        return "image/jpeg";
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }
}
