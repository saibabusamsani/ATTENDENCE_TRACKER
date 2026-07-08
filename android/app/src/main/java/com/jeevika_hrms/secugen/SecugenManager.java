package com.jeevika_hrms.secugen;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import SecuGen.FDxSDKPro.JSGFPLib;
import SecuGen.FDxSDKPro.SGDeviceInfoParam;
import SecuGen.FDxSDKPro.SGFDxDeviceName;
import SecuGen.FDxSDKPro.SGFDxErrorCode;
import SecuGen.FDxSDKPro.SGFDxTemplateFormat;
import SecuGen.FDxSDKPro.SGFingerInfo;
import SecuGen.FDxSDKPro.SGFingerPosition;
import SecuGen.FDxSDKPro.SGImpressionType;

/**
 * Singleton owner of the SecuGen SDK.
 *
 * Rules enforced here:
 *  - Every JSGFPLib call runs on ONE dedicated worker thread (the SDK is not thread-safe).
 *  - USB permission is requested lazily inside initialize().
 *  - Capture is blocking (GetImageEx) but only ever blocks the worker thread, never JS/UI.
 *  - Template format is ISO 19794-2 (interoperable with Aadhaar/AEPS-style ecosystems).
 */
public final class SecugenManager {

    private static final String TAG = "SECUGEN";
    private static final String ACTION_USB_PERMISSION = "com.jeevika_hrms.USB_PERMISSION";
    public  static final int    SECUGEN_VENDOR_ID = 0x1162; // 4450

    // ---- error codes surfaced to JS (Promise reject codes) ----
    public static final String E_DEVICE_NOT_FOUND  = "E_DEVICE_NOT_FOUND";
    public static final String E_PERMISSION_DENIED = "E_PERMISSION_DENIED";
    public static final String E_NOT_INITIALIZED   = "E_NOT_INITIALIZED";
    public static final String E_SDK               = "E_SDK";
    public static final String E_TIMEOUT           = "E_TIMEOUT";
    public static final String E_BUSY              = "E_BUSY";

    private static volatile SecugenManager instance;

    public static SecugenManager getInstance(Context context) {
        if (instance == null) {
            synchronized (SecugenManager.class) {
                if (instance == null) instance = new SecugenManager(context.getApplicationContext());
            }
        }
        return instance;
    }

    // ------------------------------------------------------------------

    public interface Callback<T> {
        void onSuccess(T result);
        void onError(String code, String message);
    }

    public static final class CaptureData {
        public String imagePngBase64;
        public int quality;
        public int nfiq;
        public int width;
        public int height;
        public byte[] rawImage; // internal use (template creation)
    }

    public static final class TemplateData {
        public String templateBase64;
        public String imagePngBase64;
        public int quality;
        public int nfiq;
    }

    // ------------------------------------------------------------------

    private final Context appContext;
    private final UsbManager usbManager;
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "SecugenWorker");
        t.setPriority(Thread.NORM_PRIORITY);
        return t;
    });

    private JSGFPLib sgfplib;
    private SGDeviceInfoParam deviceInfo;
    private volatile boolean initialized = false;
    private final AtomicBoolean capturing = new AtomicBoolean(false);

    private SecugenManager(Context appContext) {
        this.appContext = appContext;
        this.usbManager = (UsbManager) appContext.getSystemService(Context.USB_SERVICE);
    }

    public boolean isInitialized() { return initialized; }

    // ------------------------------------------------------------------
    // Device discovery
    // ------------------------------------------------------------------

    public UsbDevice findReader() {
        Map<String, UsbDevice> devices = usbManager.getDeviceList();
        Log.d(TAG, "USB device count = " + devices.size());
        for (UsbDevice d : devices.values()) {
            Log.d(TAG, "USB device: vendorId=0x" + Integer.toHexString(d.getVendorId())
                    + " productId=0x" + Integer.toHexString(d.getProductId())
                    + " name=" + d.getDeviceName()
                    + " product=" + d.getProductName());
            if (d.getVendorId() == SECUGEN_VENDOR_ID) return d;
        }
        return null;
    }

    public boolean isDeviceAttached() { return findReader() != null; }

    // ------------------------------------------------------------------
    // Initialize / deinitialize
    // ------------------------------------------------------------------

    public void initialize(Callback<SGDeviceInfoParam> cb) {
        worker.execute(() -> {
            try {
                if (initialized) { cb.onSuccess(deviceInfo); return; }

                UsbDevice device = findReader();
                if (device == null) {
                    cb.onError(E_DEVICE_NOT_FOUND, "No SecuGen fingerprint reader attached");
                    return;
                }

                if (!usbManager.hasPermission(device) && !requestPermissionBlocking(device)) {
                    cb.onError(E_PERMISSION_DENIED, "USB permission denied by user");
                    return;
                }

                sgfplib = new JSGFPLib(appContext, usbManager);

                long err = sgfplib.Init(SGFDxDeviceName.SG_DEV_AUTO);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cleanupQuietly();
                    cb.onError(E_SDK, "Init failed: " + errorName(err));
                    return;
                }

                err = sgfplib.OpenDevice(0);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cleanupQuietly();
                    cb.onError(E_SDK, "OpenDevice failed: " + errorName(err));
                    return;
                }

                deviceInfo = new SGDeviceInfoParam();
                err = sgfplib.GetDeviceInfo(deviceInfo);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cleanupQuietly();
                    cb.onError(E_SDK, "GetDeviceInfo failed: " + errorName(err));
                    return;
                }

                err = sgfplib.SetTemplateFormat(SGFDxTemplateFormat.TEMPLATE_FORMAT_ISO19794);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cleanupQuietly();
                    cb.onError(E_SDK, "SetTemplateFormat failed: " + errorName(err));
                    return;
                }

                initialized = true;
                Log.d(TAG, "Initialized. " + deviceInfo.imageWidth + "x"
                        + deviceInfo.imageHeight + " @" + deviceInfo.imageDPI + "dpi");
                cb.onSuccess(deviceInfo);

            } catch (Throwable t) {
                Log.e(TAG, "initialize()", t);
                cleanupQuietly();
                cb.onError(E_SDK, "Unexpected: " + t.getMessage());
            }
        });
    }

    public void deinitialize(Callback<Boolean> cb) {
        worker.execute(() -> {
            cleanupQuietly();
            cb.onSuccess(true);
        });
    }

    /** Called from the USB DETACHED broadcast. */
    public void onDeviceDetached() {
        worker.execute(this::cleanupQuietly);
    }

    private void cleanupQuietly() {
        try {
            if (sgfplib != null) {
                sgfplib.CloseDevice();
                sgfplib.Close();
            }
        } catch (Throwable t) {
            Log.w(TAG, "cleanup: " + t.getMessage());
        } finally {
            sgfplib = null;
            deviceInfo = null;
            initialized = false;
            capturing.set(false);
        }
    }

    // ------------------------------------------------------------------
    // Capture
    // ------------------------------------------------------------------

    public void capture(long timeoutMs, long minQuality, Callback<CaptureData> cb) {
        worker.execute(() -> {
            CaptureData data = doCapture(timeoutMs, minQuality, cb);
            if (data != null) cb.onSuccess(data);
        });
    }

    public void captureTemplate(long timeoutMs, long minQuality, Callback<TemplateData> cb) {
        worker.execute(() -> {
            CaptureData img = doCapture(timeoutMs, minQuality, cb);
            if (img == null) return; // error already reported

            try {
                int[] maxSize = new int[1];
                long err = sgfplib.GetMaxTemplateSize(maxSize);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cb.onError(E_SDK, "GetMaxTemplateSize failed: " + errorName(err));
                    return;
                }

                byte[] template = new byte[maxSize[0]];

                SGFingerInfo fingerInfo = new SGFingerInfo();
                fingerInfo.FingerNumber   = SGFingerPosition.SG_FINGPOS_UK;
                fingerInfo.ImageQuality   = img.quality;
                fingerInfo.ImpressionType = SGImpressionType.SG_IMPTYPE_LP;
                fingerInfo.ViewNumber     = 1;

                err = sgfplib.CreateTemplate(fingerInfo, img.rawImage, template);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cb.onError(E_SDK, "CreateTemplate failed: " + errorName(err));
                    return;
                }

                int[] actualSize = new int[1];
                err = sgfplib.GetTemplateSize(template, actualSize);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cb.onError(E_SDK, "GetTemplateSize failed: " + errorName(err));
                    return;
                }

                TemplateData out = new TemplateData();
                out.templateBase64 = Base64.encodeToString(
                        Arrays.copyOf(template, actualSize[0]), Base64.NO_WRAP);
                out.imagePngBase64 = img.imagePngBase64;
                out.quality = img.quality;
                out.nfiq = img.nfiq;
                cb.onSuccess(out);

            } catch (Throwable t) {
                Log.e(TAG, "captureTemplate()", t);
                cb.onError(E_SDK, "Unexpected: " + t.getMessage());
            }
        });
    }

    /** Runs on worker thread. Returns null after invoking cb.onError. */
    private CaptureData doCapture(long timeoutMs, long minQuality, Callback<?> cb) {
        if (!initialized || sgfplib == null || deviceInfo == null) {
            cb.onError(E_NOT_INITIALIZED, "Call initialize() first");
            return null;
        }
        if (!capturing.compareAndSet(false, true)) {
            cb.onError(E_BUSY, "A capture is already in progress");
            return null;
        }
        try {
            int width = deviceInfo.imageWidth;
            int height = deviceInfo.imageHeight;
            byte[] buffer = new byte[width * height];

            long err = sgfplib.GetImageEx(buffer, timeoutMs, minQuality);
            if (err == SGFDxErrorCode.SGFDX_ERROR_TIME_OUT) {
                cb.onError(E_TIMEOUT, "No valid fingerprint within " + timeoutMs + " ms");
                return null;
            }
            if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                cb.onError(E_SDK, "GetImageEx failed: " + errorName(err));
                return null;
            }

            int[] quality = new int[1];
            sgfplib.GetImageQuality(width, height, buffer, quality);

            long nfiq = sgfplib.ComputeNFIQEx(buffer, width, height, deviceInfo.imageDPI);

            CaptureData data = new CaptureData();
            data.rawImage = buffer;
            data.width = width;
            data.height = height;
            data.quality = quality[0];
            data.nfiq = (int) nfiq;
            data.imagePngBase64 = grayToPngBase64(buffer, width, height);
            return data;

        } catch (Throwable t) {
            Log.e(TAG, "doCapture()", t);
            cb.onError(E_SDK, "Unexpected: " + t.getMessage());
            return null;
        } finally {
            capturing.set(false);
        }
    }

    // ------------------------------------------------------------------
    // Matching (ISO 19794-2)
    // ------------------------------------------------------------------

    public void matchTemplates(String t1B64, String t2B64, long securityLevel, Callback<Boolean> cb) {
        worker.execute(() -> {
            if (!initialized || sgfplib == null) {
                cb.onError(E_NOT_INITIALIZED, "Call initialize() first");
                return;
            }
            try {
                byte[] t1 = Base64.decode(t1B64, Base64.NO_WRAP);
                byte[] t2 = Base64.decode(t2B64, Base64.NO_WRAP);
                boolean[] matched = new boolean[1];
                long err = sgfplib.MatchIsoTemplate(t1, 0, t2, 0, securityLevel, matched);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cb.onError(E_SDK, "MatchIsoTemplate failed: " + errorName(err));
                    return;
                }
                cb.onSuccess(matched[0]);
            } catch (Throwable t) {
                cb.onError(E_SDK, "Unexpected: " + t.getMessage());
            }
        });
    }

    public void getMatchingScore(String t1B64, String t2B64, Callback<Integer> cb) {
        worker.execute(() -> {
            if (!initialized || sgfplib == null) {
                cb.onError(E_NOT_INITIALIZED, "Call initialize() first");
                return;
            }
            try {
                byte[] t1 = Base64.decode(t1B64, Base64.NO_WRAP);
                byte[] t2 = Base64.decode(t2B64, Base64.NO_WRAP);
                int[] score = new int[1];
                long err = sgfplib.GetIsoMatchingScore(t1, 0, t2, 0, score);
                if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                    cb.onError(E_SDK, "GetIsoMatchingScore failed: " + errorName(err));
                    return;
                }
                cb.onSuccess(score[0]);
            } catch (Throwable t) {
                cb.onError(E_SDK, "Unexpected: " + t.getMessage());
            }
        });
    }

    public void setLed(boolean on, Callback<Boolean> cb) {
        worker.execute(() -> {
            if (!initialized || sgfplib == null) {
                cb.onError(E_NOT_INITIALIZED, "Call initialize() first");
                return;
            }
            long err = sgfplib.SetLedOn(on);
            if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                cb.onError(E_SDK, "SetLedOn failed: " + errorName(err));
            } else {
                cb.onSuccess(true);
            }
        });
    }

    // ------------------------------------------------------------------
    // USB permission (blocking, worker thread only)
    // ------------------------------------------------------------------

    private boolean requestPermissionBlocking(UsbDevice device) throws InterruptedException {
        final CountDownLatch latch = new CountDownLatch(1);
        final boolean[] granted = new boolean[1];

        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
                    granted[0] = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                    latch.countDown();
                }
            }
        };

        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            appContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            appContext.registerReceiver(receiver, filter);
        }

        try {
            // Explicit intent (setPackage) + FLAG_MUTABLE: required on Android 12+/14+
            Intent permIntent = new Intent(ACTION_USB_PERMISSION).setPackage(appContext.getPackageName());
            int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    ? PendingIntent.FLAG_MUTABLE : 0;
            PendingIntent pi = PendingIntent.getBroadcast(appContext, 0, permIntent, flags);
            usbManager.requestPermission(device, pi);

            // User must answer the system dialog; 60s is generous
            if (!latch.await(60, TimeUnit.SECONDS)) return false;
            return granted[0];
        } finally {
            try { appContext.unregisterReceiver(receiver); } catch (Exception ignored) {}
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static String grayToPngBase64(byte[] gray, int w, int h) {
        int[] pixels = new int[w * h];
        for (int i = 0; i < pixels.length; i++) {
            int v = gray[i] & 0xFF;
            pixels[i] = 0xFF000000 | (v << 16) | (v << 8) | v;
        }
        Bitmap bmp = Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, bos);
        bmp.recycle();
        return Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP);
    }

    private static final Map<Long, String> ERROR_NAMES = new HashMap<Long, String>() {{
        put(1L, "CREATION_FAILED"); put(2L, "FUNCTION_FAILED"); put(3L, "INVALID_PARAM");
        put(5L, "DLLLOAD_FAILED"); put(6L, "DLLLOAD_FAILED_DRV"); put(7L, "DLLLOAD_FAILED_ALGO");
        put(51L, "SYSLOAD_FAILED"); put(52L, "INITIALIZE_FAILED"); put(53L, "LINE_DROPPED");
        put(54L, "TIME_OUT"); put(55L, "DEVICE_NOT_FOUND"); put(56L, "DRVLOAD_FAILED");
        put(57L, "WRONG_IMAGE"); put(58L, "LACK_OF_BANDWIDTH"); put(59L, "DEV_ALREADY_OPEN");
        put(60L, "GETSN_FAILED"); put(61L, "UNSUPPORTED_DEV");
        put(101L, "FEAT_NUMBER"); put(102L, "INVALID_TEMPLATE_TYPE");
        put(103L, "INVALID_TEMPLATE1"); put(104L, "INVALID_TEMPLATE2");
        put(105L, "EXTRACT_FAIL"); put(106L, "MATCH_FAIL");
    }};

    static String errorName(long code) {
        String name = ERROR_NAMES.get(code);
        return name != null ? name + " (" + code + ")" : "ERROR_" + code;
    }
}