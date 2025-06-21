import { RenderIf } from './render-if';
import { Input, type InputProps } from './input';
import { Label } from './label';
import { cn } from './helpers';

interface Props extends InputProps {
  label: string;
  hint?: string;
  error?: string | boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const InputWithLabel = (props: Props) => {
  const { label, hint, id, error, className, inputClassName, labelClassName, required, ...rest } = props;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className={labelClassName}>{label}{required ? <sup className="ml-1">*</sup> : null}</Label>
      <Input id={id} className={cn(!!error ? 'border-destructive' : null, inputClassName)} required={required} {...rest} />
      {hint && !error ? <span className="text-xs font-medium text-muted-foreground">{hint}</span> : null}
      <RenderIf condition={!!error && typeof error === 'string'}>
        <span className="text-sm font-medium text-destructive">{error}</span>
      </RenderIf>
    </div>
  );
}

export { InputWithLabel };
