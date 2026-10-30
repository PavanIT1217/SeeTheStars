package com.webappslab.seethestars;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web app hand the home-screen widget tonight's highlights (js/widget.js). */
@CapacitorPlugin(name = "SkyWidget")
public class SkyWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        ctx.getSharedPreferences(SkyWidgetProvider.PREFS, Context.MODE_PRIVATE).edit()
            .putString("top", call.getString("top", ""))
            .putString("pass", call.getString("pass", ""))
            .putLong("at", System.currentTimeMillis())
            .apply();
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, SkyWidgetProvider.class));
        Intent intent = new Intent(ctx, SkyWidgetProvider.class).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE).putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        ctx.sendBroadcast(intent);
        call.resolve();
    }
}
