const VISION_API = 'https://vision.googleapis.com/v1/images:annotate';

export interface OcrProgress {
  percent: number;
  status: string;
}

function getApiKey(): string {
  return localStorage.getItem('klog_google_api_key') || '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem('klog_google_api_key', key.trim());
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

/**
 * Recognize text using Google Cloud Vision API (supports handwriting).
 */
export async function recognizeWithCloud(
  imageBase64: string,
  onProgress: (p: OcrProgress) => void
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('请先设置 Google Cloud API 密钥');
  }

  onProgress({ percent: 10, status: '正在上传到云端...' });

  // Strip the data URL prefix to get raw base64
  const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(`${VISION_API}?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        },
      ],
    }),
  });

  onProgress({ percent: 60, status: '正在识别文字...' });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message || `HTTP ${response.status}`;
    throw new Error(`云端识别失败: ${msg}`);
  }

  const data = await response.json();
  onProgress({ percent: 100, status: '识别完成' });

  const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
  if (!text) {
    throw new Error('未识别到文字，请确认图片中包含清晰的手写或打印内容');
  }

  return text;
}
