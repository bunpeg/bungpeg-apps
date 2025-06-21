'use client';
import { CircleCheckBigIcon, CircleDotDashedIcon, CircleOffIcon, CirclePlayIcon, CircleXIcon } from 'lucide-react';
import { Skeleton, Table, TableBody, TableCell, TableHeader, TableRow } from '@bunpeg/ui';

import { api } from '@/trpc/react';

export default function TasksList() {
  const { data: tasks = [], isLoading } = api.tasks.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  return (
    <Table>
      <TableHeader>
        <TableRow className="h-20">
          <TableCell className="w-6">
            <span className="sr-only">ID</span>
          </TableCell>
          <TableCell className="w-6">
            <span className="sr-only">Status</span>
          </TableCell>
          <TableCell>Operation</TableCell>
          <TableCell>Args</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? <SkeletonRows /> : null}
        {!isLoading && tasks.length === 0 ? <EmptySpace /> : null}
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>{task.id}</TableCell>
            <TableCell>
              {task.status === 'queued' && <CircleDotDashedIcon className="size-4" />}
              {task.status === 'processing' && <CirclePlayIcon className="size-4" />}
              {task.status === 'completed' && <CircleCheckBigIcon className="size-4" />}
              {task.status === 'failed' && <CircleXIcon className="size-4" />}
              {task.status === 'unreachable' && <CircleOffIcon className="size-4" />}
            </TableCell>
            <TableCell>{task.operation}</TableCell>
            <TableCell>
              {task.args}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SkeletonRows() {
  return (
    <>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5" />
      </TableCell>
    </TableRow>
  );
}

function EmptySpace() {
  return (
    <TableRow>
      <TableCell colSpan={4}>No tasks to show</TableCell>
    </TableRow>
  )
}
