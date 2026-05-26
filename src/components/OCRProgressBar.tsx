interface Props {
  percent: number;
  status: string;
}

export default function OCRProgressBar({ percent, status }: Props) {
  return (
    <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center">
      <div className="text-4xl mb-4 animate-bounce">🔍</div>
      <p className="text-gray-600 font-medium mb-3">{status}</p>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 mt-2">{percent}%</p>
    </div>
  );
}
