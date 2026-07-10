package com.jeevika_hrms;

import com.facebook.fbreact.specs.NativeCalculatorSpec;
import com.facebook.react.bridge.ReactApplicationContext;

public class NativeCalculatorModule extends NativeCalculatorSpec {

    public static final String NAME = "NativeCalculator";

    public NativeCalculatorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public double add(double a, double b) {
        return a + b;
    }

    @Override
    public double subtract(double a, double b) {
        return a - b;
    }

    @Override
    public double multiply(double a, double b) {
        return a * b;
    }

    @Override
    public double divide(double a, double b) {
        return a / b;
    }
}