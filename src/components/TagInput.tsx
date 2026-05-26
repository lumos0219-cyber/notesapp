import { useState } from 'react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState('');

  const addTag = (value: string) => {
    const tag = value.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs
                       px-2 py-1 rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-blue-400 hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
          }
        }}
        placeholder="输入标签，回车添加"
        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg
                   focus:outline-none focus:border-blue-300 placeholder:text-gray-300"
      />
    </div>
  );
}
