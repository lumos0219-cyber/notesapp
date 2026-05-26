const PADDLE_URL = 'http://localhost:8765/ocr';

export async function recognizeWithPaddle(
  imageBase64: string,
  onProgress: (percent: number, status: string) => void
): Promise<string> {
  onProgress(10, '正在连接本地 OCR 服务...');

  let response: Response;
  try {
    response = await fetch(PADDLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
      signal: AbortSignal.timeout(180000),
    });
  } catch {
    throw new Error(
      '无法连接到本地 OCR 服务。请确认终端里运行了: server/start.sh'
    );
  }

  onProgress(60, '正在识别文字...');

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || `服务器错误 (${response.status})`);
  }

  const data = await response.json();
  onProgress(100, '识别完成');

  if (!data.text) {
    throw new Error('未识别到文字');
  }

  return data.text;
}
