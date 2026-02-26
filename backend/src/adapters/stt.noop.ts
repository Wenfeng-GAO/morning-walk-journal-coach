import type { SttAdapter } from "./stt";

export class NoopSttAdapter implements SttAdapter {
  async transcribeAudioUrl(_audioUrl: string): Promise<string> {
    return "";
  }
}
