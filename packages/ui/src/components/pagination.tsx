import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { cn } from './helpers';
import { RenderIf } from './render-if';

interface Props {
  total: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  onPageChange: (page: number) => void;
  className?: string;
  hidePageCount?: boolean;
  hidePageSize?: boolean;
  disabled?: boolean;
}

const PAGE_SIZES = [5, 10, 25, 50, 100];

const Pagination = (props: Props) => {
  const {
    total,
    pageSize,
    onPageSizeChange,
    page,
    onPageChange,
    hidePageCount = false,
    hidePageSize = false,
    disabled = false,
    className,
  } = props;
  const totalPages = Math.ceil(total / pageSize) || 1;
  return (
    <div className={cn('flex items-center justify-between bg-background px-2 space-x-6 lg:space-x-8', className)}>
      <RenderIf condition={!hidePageCount}>
        <div className="flex items-center justify-center text-sm font-medium">
          {`Page ${page} of ${totalPages}`}
        </div>
      </RenderIf>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0 lg:flex"
          onClick={() => onPageChange(1)}
          disabled={page === 1 || disabled}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || disabled}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || disabled}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0 lg:flex"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || disabled}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <RenderIf condition={!hidePageSize}>
        <div className="flex items-center space-x-2">
          <Select defaultValue="25" onValueChange={(value) => onPageSizeChange(Number(value))} disabled={disabled}>
            <SelectTrigger className="w-[80px]">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((value) => (
                <SelectItem key={value} value={`${value}`}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </RenderIf>
    </div>
  );
};

export { Pagination };
