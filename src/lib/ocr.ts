import Tesseract from 'tesseract.js';

export async function recognizeImage(
  imageData: string,
  onProgress: (percent: number, text: string) => void
): Promise<string> {
  const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), '识别中...');
      } else {
        onProgress(0, m.status);
      }
    },
  });

  const { data } = await worker.recognize(imageData);
  await worker.terminate();
  return data.text;
}
