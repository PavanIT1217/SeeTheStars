package com.webappslab.seethestars;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SkyWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
