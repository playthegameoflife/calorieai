// Deprecated: Audio utilities no longer needed for text chat
export function decode(base64: string) { return new Uint8Array(); }
export function encode(bytes: Uint8Array) { return ''; }
export async function decodeAudioData(d: any, c: any, s: any, n: any) { return {} as AudioBuffer; }
export function createPcmBlob(d: any) { return { data: '', mimeType: '' }; }
