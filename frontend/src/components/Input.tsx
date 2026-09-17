
import React from "react";

type Props = {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
};

export default function Input({
  label,
  value,
  type = "text",
  onChange,
  required,
  placeholder,
  autoComplete,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium font-inter">{label}</label>
      <input
        className="p-2 border border-gray-300 rounded-md"
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}
