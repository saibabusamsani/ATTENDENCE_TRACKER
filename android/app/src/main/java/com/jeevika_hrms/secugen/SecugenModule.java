package com.jeevika_hrms.secugen;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import SecuGen.FDxSDKPro.SGDeviceInfoParam;

/**
 * Turbo Module bridge. All heavy work is delegated to SecugenManager's worker thread,
 * so every method here returns immediately and resolves/rejects the Promise later.
 *
 * JS events:
 *   secugenDeviceAttached  { vendorId, productId }
 *   secugenDeviceDetached  { }
 */
public class SecugenModule extends NativeSecugenModuleSpec {

    public static final String NAME = "SecugenModule";

    private static final String EVT_ATTACHED = "secugenDeviceAttached";
    private static final String EVT_DETACHED = "secugenDeviceDetached";

    private final SecugenManager manager;
    private BroadcastReceiver usbHotplugReceiver;

    public SecugenModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.manager = SecugenManager.getInstance(reactContext);
        registerHotplugReceiver(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    // ------------------------------------------------------------------
    // Spec implementation
    // ------------------------------------------------------------------

    @Override
    public void initialize(Promise promise) {
        manager.initialize(new SecugenManager.Callback<SGDeviceInfoParam>() {
            @Override public void onSuccess(SGDeviceInfoParam info) {
                WritableMap map = Arguments.createMap();
                map.putInt("imageWidth", info.imageWidth);
                map.putInt("imageHeight", info.imageHeight);
                map.putInt("imageDPI", info.imageDPI);
                promise.resolve(map);
            }
            @Override public void onError(String code, String message) {
                promise.reject(code, message);
            }
        });
    }

    @Override
    public void deinitialize(Promise promise) {
        manager.deinitialize(new SecugenManager.Callback<Boolean>() {
            @Override public void onSuccess(Boolean r) { promise.resolve(true); }
            @Override public void onError(String code, String message) { promise.reject(code, message); }
        });
    }

    @Override
    public void isDeviceAttached(Promise promise) {
        promise.resolve(manager.isDeviceAttached());
    }

    @Override
    public void capture(double timeoutMs, double minQuality, Promise promise) {
        manager.capture((long) timeoutMs, (long) minQuality,
                new SecugenManager.Callback<SecugenManager.CaptureData>() {
                    @Override public void onSuccess(SecugenManager.CaptureData d) {
                        WritableMap map = Arguments.createMap();
                        map.putString("imageBase64", d.imagePngBase64);
                        map.putInt("quality", d.quality);
                        map.putInt("nfiq", d.nfiq);
                        map.putInt("width", d.width);
                        map.putInt("height", d.height);
                        promise.resolve(map);
                    }
                    @Override public void onError(String code, String message) {
                        promise.reject(code, message);
                    }
                });
    }

    @Override
    public void captureTemplate(double timeoutMs, double minQuality, Promise promise) {
        manager.captureTemplate((long) timeoutMs, (long) minQuality,
                new SecugenManager.Callback<SecugenManager.TemplateData>() {
                    @Override public void onSuccess(SecugenManager.TemplateData d) {
                        WritableMap map = Arguments.createMap();
                        map.putString("templateBase64", d.templateBase64);
                        map.putString("imageBase64", d.imagePngBase64);
                        map.putInt("quality", d.quality);
                        map.putInt("nfiq", d.nfiq);
                        promise.resolve(map);
                    }
                    @Override public void onError(String code, String message) {
                        promise.reject(code, message);
                    }
                });
    }

    @Override
    public void matchTemplates(String templateA, String templateB, double securityLevel, Promise promise) {
        manager.matchTemplates(templateA, templateB, (long) securityLevel,
                new SecugenManager.Callback<Boolean>() {
                    @Override public void onSuccess(Boolean matched) { promise.resolve(matched); }
                    @Override public void onError(String code, String message) { promise.reject(code, message); }
                });
    }

    @Override
    public void getMatchingScore(String templateA, String templateB, Promise promise) {
        manager.getMatchingScore(templateA, templateB, new SecugenManager.Callback<Integer>() {
            @Override public void onSuccess(Integer score) { promise.resolve(score); }
            @Override public void onError(String code, String message) { promise.reject(code, message); }
        });
    }

    @Override
    public void setLed(boolean on, Promise promise) {
        manager.setLed(on, new SecugenManager.Callback<Boolean>() {
            @Override public void onSuccess(Boolean r) { promise.resolve(true); }
            @Override public void onError(String code, String message) { promise.reject(code, message); }
        });
    }

    @Override
    public void addListener(String eventName) { /* Required for NativeEventEmitter */ }

    @Override
    public void removeListeners(double count) { /* Required for NativeEventEmitter */ }

    // ------------------------------------------------------------------
    // USB hot-plug events
    // ------------------------------------------------------------------

    private void registerHotplugReceiver(ReactApplicationContext context) {
        usbHotplugReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context ctx, Intent intent) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device == null || device.getVendorId() != SecugenManager.SECUGEN_VENDOR_ID) return;

                if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(intent.getAction())) {
                    WritableMap map = Arguments.createMap();
                    map.putInt("vendorId", device.getVendorId());
                    map.putInt("productId", device.getProductId());
                    emit(EVT_ATTACHED, map);
                } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(intent.getAction())) {
                    manager.onDeviceDetached(); // release SDK handles safely
                    emit(EVT_DETACHED, Arguments.createMap());
                }
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        context.registerReceiver(usbHotplugReceiver, filter); // system broadcasts — no export flag issues
    }

    private void emit(String event, @Nullable WritableMap params) {
        ReactApplicationContext ctx = getReactApplicationContext();
        if (ctx.hasActiveReactInstance()) {
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(event, params);
        }
    }

    @Override
    public void invalidate() {
        try {
            if (usbHotplugReceiver != null) {
                getReactApplicationContext().unregisterReceiver(usbHotplugReceiver);
                usbHotplugReceiver = null;
            }
        } catch (Exception ignored) {}
        manager.deinitialize(new SecugenManager.Callback<Boolean>() {
            @Override public void onSuccess(Boolean r) {}
            @Override public void onError(String code, String message) {}
        });
        super.invalidate();
    }
}