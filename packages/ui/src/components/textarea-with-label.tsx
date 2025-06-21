import { Label } from './label';
import { Textarea, type TextareaProps } from './textarea';
import { RenderIf } from './render-if';
import { cn } from './helpers';

interface Props extends TextareaProps {
  label: string;
  error?: string | boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const TextareaWithLabel = (props: Props) => {
  const { label, id, error, className, inputClassName, labelClassName, required, ...rest } = props;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className={labelClassName}>{label}{required ? <sup className="ml-1">*</sup> : null}</Label>
      <Textarea
        id={id}
        className={cn(!!error ? 'border-destructive' : null, inputClassName)}
        required={required}
        {...rest}
      />
      <RenderIf condition={!!error && typeof error === 'string'}>
        <span className="text-sm text-destructive-foreground">{error}</span>
      </RenderIf>
    </div>
  );
};

export { TextareaWithLabel };
