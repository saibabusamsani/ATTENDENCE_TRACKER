import React, {useEffect, useRef, useState} from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeEventEmitter, NativeModules} from 'react-native';
import SecugenModule from './specs/NativeSecugenModule';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [attached, setAttached] = useState<boolean | null>(null);

  // enrolled template held in memory for verify test
  const enrolledTemplate = useRef<string | null>(null);

  const addLog = (line: string) =>
    setLog(prev => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 30));

  const fail = (e: any) => {
    setStatus(`FAIL [${e.code}]: ${e.message}`);
    addLog(`❌ [${e.code}] ${e.message}`);
  };

  // ---------------------------------------------------------------
  // Hotplug events
  // ---------------------------------------------------------------
  useEffect(() => {
    const emitter = new NativeEventEmitter(NativeModules.SecugenModule);

    const subAttach = emitter.addListener('secugenDeviceAttached', d => {
      setAttached(true);
      addLog(`🔌 Device attached (vid=${d.vendorId}, pid=${d.productId})`);
    });
    const subDetach = emitter.addListener('secugenDeviceDetached', () => {
      setAttached(false);
      addLog('🔌 Device detached — SDK released, re-initialize needed');
    });

    // initial state
    SecugenModule.isDeviceAttached().then(setAttached);

    return () => {
      subAttach.remove();
      subDetach.remove();
    };
  }, []);

  // ---------------------------------------------------------------
  // Tests
  // ---------------------------------------------------------------
  const testInit = async () => {
    try {
      setStatus('Initializing...');
      const info = await SecugenModule.initialize();
      setStatus(`✅ Init OK: ${info.imageWidth}x${info.imageHeight} @${info.imageDPI}dpi`);
      addLog(`✅ Init: ${info.imageWidth}x${info.imageHeight} @${info.imageDPI}dpi`);
    } catch (e: any) {
      fail(e);
    }
  };

  const testCapture = async () => {
    try {
      setStatus('👆 Place finger on scanner...');
      const r = await SecugenModule.capture(10000, 50);
      setImage(r.imageBase64);
      setStatus(`✅ Captured. quality=${r.quality}, nfiq=${r.nfiq}`);
      addLog(`✅ Capture: quality=${r.quality}, nfiq=${r.nfiq} (1=best, 5=worst)`);
    } catch (e: any) {
      fail(e);
    }
  };

  const testEnroll = async () => {
    try {
      setStatus('👆 ENROLL — scan finger (1st time)...');
      const a = await SecugenModule.captureTemplate(10000, 60);
      addLog(`Scan 1: quality=${a.quality}, nfiq=${a.nfiq}, tmpl=${a.templateBase64.length}b64`);
      setImage(a.imageBase64);

      if (a.nfiq > 3) {
        setStatus(`⚠️ Scan 1 quality too low (nfiq=${a.nfiq}) — retry enroll`);
        return;
      }

      setStatus('👆 ENROLL — lift and scan SAME finger (2nd time)...');
      const b = await SecugenModule.captureTemplate(10000, 60);
      addLog(`Scan 2: quality=${b.quality}, nfiq=${b.nfiq}`);

      const matched = await SecugenModule.matchTemplates(
        a.templateBase64,
        b.templateBase64,
        5, // SL_NORMAL for enroll confirmation
      );
      const score = await SecugenModule.getMatchingScore(a.templateBase64, b.templateBase64);

      if (matched) {
        enrolledTemplate.current = a.templateBase64;
        setStatus(`✅ ENROLLED. Cross-match OK, score=${score}`);
        addLog(`✅ Enrolled. score=${score} — template stored in memory`);
      } else {
        setStatus(`❌ Enroll failed — scans don't match (score=${score}). Same finger?`);
        addLog(`❌ Enroll cross-match failed, score=${score}`);
      }
    } catch (e: any) {
      fail(e);
    }
  };

  const testVerify = async () => {
    if (!enrolledTemplate.current) {
      setStatus('⚠️ Enroll a finger first');
      return;
    }
    try {
      setStatus('👆 VERIFY — scan any finger...');
      const live = await SecugenModule.captureTemplate(10000, 50);
      setImage(live.imageBase64);

      const matched = await SecugenModule.matchTemplates(
        enrolledTemplate.current,
        live.templateBase64,
        7, // SL_HIGH — attendance-grade for fingerprint-only
      );
      const score = await SecugenModule.getMatchingScore(
        enrolledTemplate.current,
        live.templateBase64,
      );

      setStatus(matched ? `✅ MATCH — punch accepted (score=${score})` : `❌ NO MATCH (score=${score})`);
      addLog(`Verify: matched=${matched}, score=${score} (threshold≈100 @ SL_HIGH)`);
    } catch (e: any) {
      fail(e);
    }
  };

  const testDeinit = async () => {
    try {
      await SecugenModule.deinitialize();
      setStatus('Deinitialized');
      addLog('Deinitialized — call Initialize before next capture');
    } catch (e: any) {
      fail(e);
    }
  };

  // ---------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>SecuGen Turbo Module — Test</Text>

      <View style={styles.row}>
        <Text style={styles.badge}>
          Reader: {attached === null ? '…' : attached ? '🟢 Attached' : '🔴 Not attached'}
        </Text>
        <Text style={styles.badge}>
          Enrolled: {enrolledTemplate.current ? '🟢 Yes' : '⚪ No'}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button title="1. Initialize" onPress={testInit} />
        <Button title="2. Capture (image only)" onPress={testCapture} />
        <Button title="3. Enroll (2 scans + match)" onPress={testEnroll} />
        <Button title="4. Verify (punch test)" onPress={testVerify} />
        <Button title="5. Deinitialize" onPress={testDeinit} color="#888" />
      </View>

      <Text style={styles.status}>{status}</Text>

      <View style={styles.body}>
        {image && (
          <Image
            source={{uri: `data:image/png;base64,${image}`}}
            style={styles.fp}
            resizeMode="contain"
          />
        )}
        <ScrollView style={styles.log}>
          {log.map((l, i) => (
            <Text key={i} style={styles.logLine}>{l}</Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 16, gap: 10, backgroundColor: '#fff'},
  title: {fontSize: 18, fontWeight: '700', textAlign: 'center'},
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  badge: {fontSize: 13, color: '#333'},
  buttons: {gap: 8},
  status: {fontSize: 15, fontWeight: '600', minHeight: 40, color: '#1a1a1a'},
  body: {flex: 1, flexDirection: 'row', gap: 10},
  fp: {width: 130, height: 175, borderWidth: 1, borderColor: '#ccc'},
  log: {flex: 1, backgroundColor: '#f4f4f4', borderRadius: 6, padding: 8},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});