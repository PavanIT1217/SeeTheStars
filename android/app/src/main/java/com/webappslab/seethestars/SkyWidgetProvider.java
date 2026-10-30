package com.webappslab.seethestars;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/**
 * Home-screen widget: tonight's Moon (worked out here, so it is right even if the app isn't opened),
 * plus the best thing to see and the next bright space-station pass, as last saved by the app.
 */
public class SkyWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "sky_widget";
    private static final double SYNODIC = 29.530588853;
    private static final long NEW_MOON_2000 = 947182440000L; // 2000-01-06 18:14 UT
    private static final String[][] PHASES = {
        {"🌑", "New Moon"}, {"🌒", "Waxing crescent"}, {"🌓", "First quarter"}, {"🌔", "Waxing gibbous"},
        {"🌕", "Full Moon"}, {"🌖", "Waning gibbous"}, {"🌗", "Last quarter"}, {"🌘", "Waning crescent"},
    };

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean fresh = System.currentTimeMillis() - p.getLong("at", 0) < 36 * 3600 * 1000L;
        double age = ((System.currentTimeMillis() - NEW_MOON_2000) / 86400000.0) % SYNODIC;
        if (age < 0) age += SYNODIC;
        int lit = (int) Math.round((1 - Math.cos(2 * Math.PI * age / SYNODIC)) / 2 * 100);
        String[] phase = PHASES[(int) Math.round(age / SYNODIC * 8) % 8];

        PendingIntent open = PendingIntent.getActivity(ctx, 0, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_sky);
            v.setTextViewText(R.id.widget_moon_emoji, phase[0]);
            v.setTextViewText(R.id.widget_moon, phase[1] + " · " + lit + "% lit");
            v.setTextViewText(R.id.widget_top, fresh ? p.getString("top", "") : "Open See the Stars for tonight’s sky");
            v.setTextViewText(R.id.widget_pass, fresh ? p.getString("pass", "") : "");
            v.setOnClickPendingIntent(R.id.widget_root, open);
            mgr.updateAppWidget(id, v);
        }
    }
}
