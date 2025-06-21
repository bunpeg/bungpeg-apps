import { RenderIf } from './render-if';
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from './select';
import { Label } from './label';
import { cn } from './helpers';

type Item = { value: string; label: string };

interface Props {
  label?: string;
  value: string;
  options: Item[];
  onValueChange: (value: string) => void;
  className?: string;
}

function SelectWithOptions(props: Props) {
  const { label, options, value, onValueChange, className } = props;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <RenderIf condition={!!label}>
        <Label>{label}</Label>
      </RenderIf>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { SelectWithOptions };
