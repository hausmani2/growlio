import { Input, Select, Tooltip } from 'antd';

const FormField = ({ 
    type = 'input',
    label, 
    required = false,
    tooltip,
    error,
    className = '',
    ...props 
}) => {
    const renderField = () => {
        const commonProps = {
            className: `w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                error ? 'border-red-500' : 'border-gray-300'
            } ${className}`,
            status: error ? 'error' : '',
            ...props
        };

        switch (type) {
            case 'textarea':
                return (
                    <Input.TextArea 
                        {...commonProps}
                        className={`w-full p-2 border h-[60px] rounded-md text-base font-normal text-neutral-700 ${
                            error ? 'border-red-500' : 'border-gray-300'
                        } ${className}`}
                    />
                );
            case 'select':
                return <Select {...commonProps} />;
            default:
                return <Input {...commonProps} />;
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-base !font-bold text-neutral-600 flex items-center gap-2">
                {label}
                {required && <span className="text-red-500">*</span>}
                {tooltip && (
                    <Tooltip placement="bottomLeft" title={tooltip.title}>
                        <img src={tooltip.icon} alt="info" />
                    </Tooltip>
                )}
            </label>
            {renderField()}
            {error && (
                <span className="text-red-500 text-sm">{error}</span>
            )}
        </div>
    );
};

export default FormField; 