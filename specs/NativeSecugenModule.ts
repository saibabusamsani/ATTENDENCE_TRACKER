import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface DeviceInfo {
  imageWidth: number;
  imageHeight: number;
  imageDPI: number;
}

export interface CaptureResult {
  imageBase64: string; // PNG, displayable directly in <Image>
  quality: number; // 0-100 (SecuGen quality)
  nfiq: number; // 1 (best) - 5 (worst)
  width: number;
  height: number;
}

export interface TemplateResult {
  templateBase64: string; // ISO 19794-2 template
  imageBase64: string; // PNG preview
  quality: number;
  nfiq: number;
}

export interface Spec extends TurboModule {
  /** Finds the reader, requests USB permission if needed, Init + OpenDevice. */
  initialize(): Promise<DeviceInfo>;

  /** CloseDevice + Close. Safe to call multiple times. */
  deinitialize(): Promise<boolean>;

  /** True if a SecuGen reader is currently attached (permission not required). */
  isDeviceAttached(): Promise<boolean>;

  /** Blocking capture (runs on native worker thread). timeoutMs e.g. 10000, minQuality e.g. 50. */
  capture(timeoutMs: number, minQuality: number): Promise<CaptureResult>;

  /** Capture + extract ISO 19794-2 template in one pass. Use for enroll & verify. */
  captureTemplate(timeoutMs: number, minQuality: number): Promise<TemplateResult>;

  /** securityLevel: 1..9 (5 = SL_NORMAL). Templates are base64 ISO 19794-2. */
  matchTemplates(
    templateA: string,
    templateB: string,
    securityLevel: number,
  ): Promise<boolean>;

  /** Matching score 0-199 between two ISO templates. */
  getMatchingScore(templateA: string, templateB: string): Promise<number>;

  setLed(on: boolean): Promise<boolean>;

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SecugenModule');