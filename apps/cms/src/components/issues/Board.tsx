'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from 'react';
import { PiPencilSimple, PiPlus, PiTrash } from 'react-icons/pi';

import {
  type Board as BoardData,
  type Issue,
  type IssueColumn,
  formatIssueKey,
} from '@/lib/issues';

import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import { inputClass } from '../editor/Field';
import {
  type ActionResult,
  createColumn,
  deleteColumn,
  moveColumn,
  moveIssue,
  renameColumn,
} from './actions';

// Positions are counted among the other columns, or the column's other
// issues, i.e. without the moved one.
type Move =
  | { kind: 'issue'; id: string; columnId: string; position: number }
  | { kind: 'column'; id: string; position: number };

type Dragged = { kind: 'issue' | 'column'; id: string };

// Where a dragged issue or column would end up if dropped. columnId is only
// set for issues.
type DropTarget = { columnId?: string; position: number };

const insertAt = <T,>(items: T[], item: T, position: number) => {
  const index = Math.max(0, Math.min(position, items.length));
  return [...items.slice(0, index), item, ...items.slice(index)];
};

const withPositions = <T extends { position: number }>(items: T[]) =>
  items.map((item, position) => ({ ...item, position }));

// Does what the database does on a move, so the board shows it right away.
const applyMove = (board: BoardData, move: Move): BoardData => {
  if (move.kind === 'column') {
    const column = board.columns.find(({ id }) => id === move.id);
    if (!column) {
      return board;
    }
    const others = board.columns.filter(({ id }) => id !== move.id);
    return {
      ...board,
      columns: withPositions(insertAt(others, column, move.position)),
    };
  }

  const issue = board.issues.find(({ id }) => id === move.id);
  if (!issue) {
    return board;
  }
  const others = board.issues.filter(({ id }) => id !== move.id);
  const moved = { ...issue, column_id: move.columnId };
  const target = withPositions(
    insertAt(
      others.filter(({ column_id }) => column_id === move.columnId),
      moved,
      move.position,
    ),
  );
  const source = withPositions(
    others.filter(({ column_id }) => column_id === issue.column_id),
  );
  const rest = others.filter(
    ({ column_id }) =>
      column_id !== move.columnId && column_id !== issue.column_id,
  );
  return { ...board, issues: [...rest, ...source, ...target] };
};

// The number of elements, other than the dragged one, that come before the
// pointer. axis tells whether they're laid out from top to bottom or left to
// right.
const findPosition = (
  elements: NodeListOf<HTMLElement>,
  draggedId: string,
  pointer: number,
  axis: 'y' | 'x',
) => {
  let position = 0;
  for (const element of elements) {
    if (element.dataset.id === draggedId) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    const middle =
      axis === 'y' ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    if (pointer < middle) {
      break;
    }
    position++;
  }
  return position;
};

const dropLine = 'rounded-full bg-blue-500';

export function Board({
  siteId,
  board: savedBoard,
}: {
  siteId: string;
  board: BoardData;
}) {
  const [board, addMove] = useOptimistic(savedBoard, applyMove);
  const [, startMoving] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);
  const [dragged, setDragged] = useState<Dragged | undefined>(undefined);
  const [dropTarget, setDropTarget] = useState<DropTarget | undefined>(
    undefined,
  );

  const columns = [...board.columns].sort((a, b) => a.position - b.position);
  const issuesByColumn = new Map<string, Issue[]>(
    columns.map(({ id }) => [id, []]),
  );
  for (const issue of [...board.issues].sort(
    (a, b) => a.position - b.position,
  )) {
    issuesByColumn.get(issue.column_id)?.push(issue);
  }

  const run = (action: () => Promise<ActionResult>) => {
    setError(undefined);
    startMoving(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
      }
    });
  };

  const move = (next: Move) => {
    setError(undefined);
    startMoving(async () => {
      addMove(next);
      const result =
        next.kind === 'issue'
          ? await moveIssue(siteId, next.id, next.columnId, next.position)
          : await moveColumn(siteId, next.id, next.position);
      if (!result.ok) {
        setError(result.error);
      }
    });
  };

  const endDrag = () => {
    setDragged(undefined);
    setDropTarget(undefined);
  };

  const startDrag = (event: DragEvent, next: Dragged) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', next.id);
    setDragged(next);
  };

  const setTarget = (next: DropTarget) => {
    if (
      dropTarget?.columnId !== next.columnId ||
      dropTarget?.position !== next.position
    ) {
      setDropTarget(next);
    }
  };

  const onIssueDragOver = (event: DragEvent<HTMLElement>, columnId: string) => {
    if (dragged?.kind !== 'issue') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setTarget({
      columnId,
      position: findPosition(
        event.currentTarget.querySelectorAll<HTMLElement>('[data-issue]'),
        dragged.id,
        event.clientY,
        'y',
      ),
    });
  };

  const onColumnDragOver = (event: DragEvent<HTMLOListElement>) => {
    if (dragged?.kind !== 'column') {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setTarget({
      position: findPosition(
        event.currentTarget.querySelectorAll<HTMLElement>('[data-column]'),
        dragged.id,
        event.clientX,
        'x',
      ),
    });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dragged || !dropTarget) {
      endDrag();
      return;
    }
    if (dragged.kind === 'issue' && dropTarget.columnId) {
      const issue = board.issues.find(({ id }) => id === dragged.id);
      const current = issuesByColumn
        .get(dropTarget.columnId)
        ?.findIndex(({ id }) => id === dragged.id);
      // Dropped where it already was.
      const isSame =
        issue?.column_id === dropTarget.columnId &&
        current === dropTarget.position;
      if (issue && !isSame) {
        move({
          kind: 'issue',
          id: dragged.id,
          columnId: dropTarget.columnId,
          position: dropTarget.position,
        });
      }
    }
    if (dragged.kind === 'column') {
      const current = columns.findIndex(({ id }) => id === dragged.id);
      if (current !== -1 && current !== dropTarget.position) {
        move({ kind: 'column', id: dragged.id, position: dropTarget.position });
      }
    }
    endDrag();
  };

  // The columns other than the dragged one, to place the drop line among.
  const columnDropIndex =
    dragged?.kind === 'column' && dropTarget
      ? dropTarget.position
      : undefined;
  const otherColumns = columns.filter(
    ({ id }) => !(dragged?.kind === 'column' && id === dragged.id),
  );

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <header className='flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800'>
        <h1 className='text-sm font-medium'>Ärenden</h1>
        {error && (
          <p role='status' className='text-sm text-red-600 dark:text-red-400'>
            {error}
          </p>
        )}
      </header>

      <div className='flex min-h-0 flex-1 overflow-x-auto'>
        <ol
          onDragOver={onColumnDragOver}
          onDrop={onDrop}
          className='flex min-h-0 items-stretch gap-3 p-4'
        >
          {columns.map((column) => {
            const issues = issuesByColumn.get(column.id) ?? [];
            const isDraggedColumn =
              dragged?.kind === 'column' && dragged.id === column.id;
            const showLineBefore =
              columnDropIndex !== undefined &&
              otherColumns[columnDropIndex]?.id === column.id;
            return (
              <li
                key={column.id}
                data-column
                data-id={column.id}
                className='relative flex min-h-0'
              >
                {showLineBefore && (
                  <div
                    className={`${dropLine} absolute inset-y-0 -left-2 w-1`}
                  />
                )}
                <Column
                  siteId={siteId}
                  column={column}
                  issues={issues}
                  isDragged={isDraggedColumn}
                  draggedIssueId={
                    dragged?.kind === 'issue' ? dragged.id : undefined
                  }
                  issueDropPosition={
                    dragged?.kind === 'issue' &&
                    dropTarget?.columnId === column.id
                      ? dropTarget.position
                      : undefined
                  }
                  onDragStart={startDrag}
                  onDragEnd={endDrag}
                  onIssueDragOver={(event) => onIssueDragOver(event, column.id)}
                  onDrop={onDrop}
                  onRename={(name) =>
                    run(() => renameColumn(siteId, column.id, name))
                  }
                  onDelete={() => run(() => deleteColumn(siteId, column.id))}
                />
              </li>
            );
          })}
          <li className='relative flex'>
            {columnDropIndex !== undefined &&
              columnDropIndex >= otherColumns.length && (
                <div className={`${dropLine} absolute inset-y-0 -left-2 w-1`} />
              )}
            <NewColumn onCreate={(name) => run(() => createColumn(siteId, name))} />
          </li>
        </ol>
      </div>
    </div>
  );
}

function Column({
  siteId,
  column,
  issues,
  isDragged,
  draggedIssueId,
  issueDropPosition,
  onDragStart,
  onDragEnd,
  onIssueDragOver,
  onDrop,
  onRename,
  onDelete,
}: {
  siteId: string;
  column: IssueColumn;
  issues: Issue[];
  isDragged: boolean;
  draggedIssueId?: string;
  // Counted among the issues other than the dragged one.
  issueDropPosition?: number;
  onDragStart: (event: DragEvent, dragged: Dragged) => void;
  onDragEnd: () => void;
  onIssueDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const pathname = usePathname();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const others = issues.filter(({ id }) => id !== draggedIssueId);
  const lineBeforeId =
    issueDropPosition !== undefined ? others[issueDropPosition]?.id : undefined;
  const showLineLast =
    issueDropPosition !== undefined && issueDropPosition >= others.length;

  const iconButtonClass =
    'rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-700';

  return (
    <section
      onDragOver={onIssueDragOver}
      onDrop={onDrop}
      className={`flex w-72 flex-col rounded-lg bg-zinc-100 dark:bg-zinc-900 ${
        isDragged ? 'opacity-40' : ''
      }`}
    >
      <header
        draggable={!isRenaming}
        onDragStart={(event) =>
          onDragStart(event, { kind: 'column', id: column.id })
        }
        onDragEnd={onDragEnd}
        className={`group flex items-center gap-2 px-3 py-2 ${
          isRenaming ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {isRenaming ? (
          <ColumnNameForm
            initial={column.name}
            label='Kolumnens namn'
            onSubmit={(name) => {
              setIsRenaming(false);
              if (name.trim() && name !== column.name) {
                onRename(name);
              }
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <>
            <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
              {column.name}
            </h2>
            <span className='text-xs text-zinc-500'>{issues.length}</span>
            <div className='flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'>
              <button
                type='button'
                onClick={() => setIsRenaming(true)}
                title='Byt namn'
                aria-label={`Byt namn på ${column.name}`}
                className={iconButtonClass}
              >
                <PiPencilSimple />
              </button>
              <button
                type='button'
                onClick={() => setIsConfirmingDelete(true)}
                disabled={issues.length > 0}
                title={
                  issues.length > 0
                    ? 'Kolumnen har ärenden och kan inte tas bort.'
                    : 'Ta bort'
                }
                aria-label={`Ta bort ${column.name}`}
                className={iconButtonClass}
              >
                <PiTrash />
              </button>
            </div>
          </>
        )}
      </header>

      <ol className='flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2'
      >
        {issues.map((issue) => {
          const key = formatIssueKey(siteId, issue.number);
          const href = `/${siteId}/issues/${key}`;
          const isActive = pathname === href;
          return (
            <li
              key={issue.id}
              data-issue
              data-id={issue.id}
              className='relative'
            >
              {lineBeforeId === issue.id && (
                <div className={`${dropLine} absolute inset-x-0 -top-1.5 h-1`} />
              )}
              <Link
                href={href}
                draggable
                onDragStart={(event) =>
                  onDragStart(event, { kind: 'issue', id: issue.id })
                }
                onDragEnd={onDragEnd}
                className={`flex flex-col gap-1 rounded-md border bg-white px-3 py-2 shadow-sm transition-colors hover:border-blue-400 dark:bg-zinc-800 ${
                  isActive
                    ? 'border-blue-500'
                    : 'border-zinc-200 dark:border-zinc-700'
                } ${draggedIssueId === issue.id ? 'opacity-40' : ''}`}
              >
                <span className='text-xs font-medium text-zinc-500'>{key}</span>
                <span className='text-sm break-words'>{issue.title}</span>
              </Link>
            </li>
          );
        })}
        {showLineLast && <li aria-hidden className={`${dropLine} h-1`} />}
      </ol>

      <Link
        href={`/${siteId}/issues/new?column=${column.id}`}
        className='m-2 mt-0 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'
      >
        <PiPlus /> Nytt ärende
      </Link>

      {isConfirmingDelete && (
        <ConfirmDeleteDialog
          heading='Ta bort kolumn?'
          message={`”${column.name}” tas bort från tavlan.`}
          onConfirm={() => {
            setIsConfirmingDelete(false);
            onDelete();
          }}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </section>
  );
}

function NewColumn({ onCreate }: { onCreate: (name: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button
        type='button'
        onClick={() => setIsAdding(true)}
        className='flex h-fit w-72 items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900'
      >
        <PiPlus /> Ny kolumn
      </button>
    );
  }

  return (
    <div className='h-fit w-72 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900'>
      <ColumnNameForm
        initial=''
        label='Ny kolumns namn'
        placeholder='Kolumnens namn…'
        onSubmit={(name) => {
          setIsAdding(false);
          if (name.trim()) {
            onCreate(name);
          }
        }}
        onCancel={() => setIsAdding(false)}
      />
    </div>
  );
}

// Saves on Enter or when leaving the field, and cancels on Escape.
function ColumnNameForm({
  initial,
  label,
  placeholder,
  onSubmit,
  onCancel,
}: {
  initial: string;
  label: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  // Escape blurs the field too, which shouldn't save.
  const isCancelled = useRef(false);

  return (
    <form
      className='min-w-0 flex-1'
      onSubmit={(event) => {
        event.preventDefault();
        event.currentTarget.querySelector('input')?.blur();
      }}
    >
      <input
        type='text'
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            isCancelled.current = true;
            onCancel();
          }
        }}
        onBlur={() => {
          if (!isCancelled.current) {
            onSubmit(name);
          }
        }}
        aria-label={label}
        placeholder={placeholder}
        className={`${inputClass} py-1`}
        autoFocus
        autoComplete='off'
      />
    </form>
  );
}
