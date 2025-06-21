interface Props {
  page: number;
  pageSize: number;
  count: number;
  label: string;
}

export function TableItemsCount(props: Props) {
  const { page, pageSize, count, label } = props;
  const lowerEnd = count > 0 ? page * pageSize - pageSize + 1 : 0;
  const upperEnd = page * pageSize > count ? count : page * pageSize;

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400">
      Showing
      <strong> {lowerEnd} - {upperEnd}</strong> of <strong>{count} </strong>
      {label}
    </div>
  );
}
