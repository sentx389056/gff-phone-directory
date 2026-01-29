"use client";

import { Fragment, useEffect, useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  cn: string
  uid: string;
  sn: string;
  displayName?: string;
  mail?: string;
  telephoneNumber?: string;
  ipPhone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  departmentNumber?: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || `Ошибка загрузки (${res.status})`);
          setUsers([]);
          return;
        }
        setError(null);
        setUsers(data.users || []);
      } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
        setError('Ошибка сети');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const fields = [
        u.displayName, u.cn, u.sn, u.uid,
        u.mail, u.telephoneNumber, u.ipPhone, u.mobile,
        u.title, u.department, u.departmentNumber,
      ];
      return fields.some((f) => f && f.toLowerCase().includes(q));
    });
  }, [users, search]);

  const thClass = 'border-x bg-accent sticky top-0 z-10 text-xs md:text-sm p-1 md:p-2';
  const thHidden = 'hidden md:table-cell';
  const tdClass = 'border whitespace-normal text-xs md:text-sm p-1 md:p-2';
  const tdHidden = 'hidden md:table-cell';

  return (
    <div className="p-2 md:p-5">
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md text-sm md:text-base"
      />
      {loading ? (
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Доб. телефон</TableHead>
              <TableHead className={thHidden}>Мобильный</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className={thHidden}>Должность</TableHead>
              <TableHead className={thHidden}>Подразделение</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(6)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell className={tdHidden}><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell className={tdHidden}><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell className={tdHidden}><Skeleton className="h-4 w-full bg-muted/60 dark:bg-muted/30" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : error ? (
        <p>{error}</p>
      ) : filteredUsers.length === 0 ? (
        <p>Пользователи не найдены</p>
      ) : (
        <div className="w-full overflow-y-auto max-h-[84vh]">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className={thClass}>ФИО</TableHead>
                <TableHead className={thClass}>Телефон</TableHead>
                <TableHead className={thClass}>Доб. телефон</TableHead>
                <TableHead className={`${thClass} ${thHidden}`}>Мобильный</TableHead>
                <TableHead className={thClass}>Email</TableHead>
                <TableHead className={`${thClass} ${thHidden}`}>Должность</TableHead>
                <TableHead className={`${thClass} ${thHidden}`}>Подразделение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u, i) => {
                const isExpanded = expandedRow === i;
                const details = [
                  { label: 'Мобильный', value: u.mobile },
                  { label: 'Должность', value: u.title },
                  { label: 'Подразделение', value: u.department || u.departmentNumber },
                ].filter((d) => d.value);
                return (
                  <Fragment key={u.uid || i}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                    >
                      <TableCell className={tdClass}>{u.displayName || u.cn || u.sn || ''}</TableCell>
                      <TableCell className={tdClass}>{u.telephoneNumber || ''}</TableCell>
                      <TableCell className={tdClass}>{u.ipPhone || ''}</TableCell>
                      <TableCell className={`${tdClass} ${tdHidden}`}>{u.mobile || ''}</TableCell>
                      <TableCell className={`${tdClass} break-all`}>{u.mail || ''}</TableCell>
                      <TableCell className={`${tdClass} ${tdHidden}`}>{u.title || ''}</TableCell>
                      <TableCell className={`${tdClass} ${tdHidden}`}>{u.department || u.departmentNumber || ''}</TableCell>
                    </TableRow>
                    {isExpanded && details.length > 0 && (
                      <TableRow className="md:hidden bg-muted/30">
                        <TableCell colSpan={4} className="p-2 text-xs">
                          <div className="space-y-1">
                            {details.map((d) => (
                              <div key={d.label} className="flex justify-between">
                                <span className="text-muted-foreground">{d.label}</span>
                                <span className="break-all text-right ml-2">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}



