import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="space-y-1">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wide ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
                        block w-full rounded-xl border py-3 text-gray-900 shadow-sm
                        ring-1 ring-inset placeholder:text-gray-400 
                        focus:ring-2 focus:ring-inset focus:ring-[#009CDE] focus:border-[#009CDE]
                        sm:text-sm sm:leading-6 bg-gray-50 transition-all
                        ${icon ? 'pl-12 pr-4' : 'px-4'}
                        ${error
                            ? 'border-red-300 ring-red-200 focus:ring-red-500'
                            : 'border-gray-200 ring-gray-200'
                        }
                        ${className}
                    `}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
            </div>
            {error && (
                <p
                    id={`${inputId}-error`}
                    className="text-red-500 text-xs mt-1 ml-1"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
