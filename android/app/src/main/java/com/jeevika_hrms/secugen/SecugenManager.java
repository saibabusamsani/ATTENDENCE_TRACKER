package com.jeevika_hrms.secugen;

import android.content.Context;
import android.hardware.usb.UsbManager;
import android.util.Log;

import SecuGen.FDxSDKPro.JSGFPLib;
import SecuGen.FDxSDKPro.SGDeviceInfoParam;
import SecuGen.FDxSDKPro.SGFDxDeviceName;

public class SecugenManager {

    private static final String TAG = "SECUGEN";

    private final JSGFPLib sgfplib;

    public SecugenManager(Context context) {

        UsbManager usbManager =
                (UsbManager) context.getSystemService(Context.USB_SERVICE);

        sgfplib = new JSGFPLib(context, usbManager);
    }

    public void initialize() {

        // ---------------------------
        // Initialize SDK
        // ---------------------------
        long result = sgfplib.Init(SGFDxDeviceName.SG_DEV_AUTO);
        Log.d(TAG, "Init Result = " + result);

        if (result != 0) {
            Log.e(TAG, "Init Failed");
            return;
        }

        // ---------------------------
        // Open Scanner
        // ---------------------------
        result = sgfplib.OpenDevice(0);
        Log.d(TAG, "OpenDevice Result = " + result);

        if (result != 0) {
            Log.e(TAG, "OpenDevice Failed");
            return;
        }

        // ---------------------------
        // Device Info
        // ---------------------------
        SGDeviceInfoParam deviceInfo = new SGDeviceInfoParam();

        result = sgfplib.GetDeviceInfo(deviceInfo);

        Log.d(TAG, "GetDeviceInfo Result = " + result);
        Log.d(TAG, "Width = " + deviceInfo.imageWidth);
        Log.d(TAG, "Height = " + deviceInfo.imageHeight);
        Log.d(TAG, "DPI = " + deviceInfo.imageDPI);

        // ---------------------------
        // Wait for Finger
        // ---------------------------
        boolean[] fingerPresent = new boolean[1];

        Log.d(TAG, "Waiting for finger...");

        while (true) {

            result = sgfplib.FingerPresent(fingerPresent);

            if (result != 0) {
                Log.e(TAG, "FingerPresent Error = " + result);
                return;
            }

            if (fingerPresent[0]) {
                Log.d(TAG, "Finger Detected!");
                break;
            }

            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        // ---------------------------
        // Capture Image
        // ---------------------------
        int imageSize = deviceInfo.imageWidth * deviceInfo.imageHeight;

        byte[] imageBuffer = new byte[imageSize];

        result = sgfplib.GetImage(imageBuffer);

        Log.d(TAG, "GetImage Result = " + result);

        if (result == 0) {
            Log.d(TAG, "Fingerprint Captured Successfully");
            Log.d(TAG, "Image Buffer Size = " + imageBuffer.length);
        } else {
            Log.e(TAG, "Capture Failed. Error = " + result);
        }

        // ---------------------------
        // Close Scanner
        // ---------------------------
        sgfplib.CloseDevice();
    }
}