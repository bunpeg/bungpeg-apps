import { type ComponentProps } from 'react';

type TimePickerProps = Omit<ComponentProps<'input'>, 'type'>;

const TimePicker = (props: TimePickerProps) => {
  return (
    <input
      type="time"
      className="h-10 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      {...props}
    />
  );
};

export { TimePicker, type TimePickerProps };
