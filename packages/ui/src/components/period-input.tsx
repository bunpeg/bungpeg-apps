import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './index';

interface Props {
  value: string;
  onChange?: (value: string) => void;
}

export function PeriodInput(props: Props) {
  const { value, onChange } = props;
  const [amount, period] = processPeriod(value);
  const isPlural = amount > 1;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;

    const nextValue = Number(e.target.value);

    if (Number.isNaN(nextValue)) {
      onChange(`0_${period}`);
      return;
    }

    onChange(`${nextValue}_${period}`);
  };

  const handlePeriodChange = (__value: string) => {
    if (!onChange) return;
    onChange(`${amount}_${__value}`);
  }

  return (
    <div className="w-full grid grid-cols-2 gap-2">
      <Input type="number" value={amount.toString()} onChange={handleAmountChange} />
      <Select value={period ?? ''} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a period"/>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">{isPlural ? 'weeks' : 'week'}</SelectItem>
          <SelectItem value="month">{isPlural ? 'months' : 'month'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function PeriodInputPlaceholder() {
  return (
    <div className="w-full grid grid-cols-2 gap-2">
      <Input type="number" />
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a period"/>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">week</SelectItem>
          <SelectItem value="month">month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function processPeriod(value: string): [number, string | null] {
  const [amount, period] = value.split('_');

  if (!amount || !period) {
    return [0, 'week'];
  }

  const __amount = Number(amount);

  if (Number.isNaN(__amount)) {
    return [0, period];
  }

  return [__amount, period];
}

export function generatePeriodLabel(value: string)  {
  const [amount, period] = processPeriod(value);
  const isPlural = amount > 1;

  return `${amount} ${period}${isPlural ? 's' : ''}`;
}
