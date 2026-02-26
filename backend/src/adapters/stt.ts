export interface SttAdapter {
  transcribeAudioUrl(audioUrl: string): Promise<string>;
}
