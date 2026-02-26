import type { SttAdapter } from "./stt";

export class MockSttAdapter implements SttAdapter {
  async transcribeAudioUrl(_audioUrl: string): Promise<string> {
    return "mock transcript from audio";
  }
}
