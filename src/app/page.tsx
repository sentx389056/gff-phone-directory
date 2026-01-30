"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ArrowUp } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handler = () => scrollToTop();
    window.addEventListener('scroll-to-top', handler);
    return () => window.removeEventListener('scroll-to-top', handler);
  }, [scrollToTop]);

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
    const withTitle = users.filter((u) => u.title && u.title.trim().length > 0);
    const q = search.toLowerCase().trim();
    if (!q) return withTitle;
    return withTitle.filter((u) => {
      const fields = [
        u.displayName, u.cn, u.sn, u.uid,
        u.mail, u.telephoneNumber, u.ipPhone, u.mobile,
        u.title, u.department, u.departmentNumber,
      ];
      return fields.some((f) => f && f.toLowerCase().includes(q));
    });
  }, [users, search]);

  const thClass = 'border-x bg-accent sticky top-0 z-10 text-center text-xs md:text-sm p-1 md:p-2';
  const thHidden = 'hidden xl:table-cell';
  const tdClass = 'border whitespace-normal text-xs md:text-sm p-1 md:p-2';
  const tdHidden = 'hidden xl:table-cell';

  return (
    <div className="flex flex-col h-full p-2 md:p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 w-full max-w-md">
        <Input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded w-full text-sm md:text-base"
        />
          <Button
            onClick={() => setSearch("")}
          >
            Сбросить
          </Button>
      </div>
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
        <div
          ref={scrollRef}
          className="relative w-full overflow-y-auto max-h-[84vh]"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setShowScrollTop(target.scrollTop > 300);
          }}
        >
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
                      <TableCell className={`${tdClass}`}>{u.displayName || u.cn || u.sn || ''}</TableCell>
                      <TableCell className={`${tdClass} text-center`}>{u.telephoneNumber || ''}</TableCell>
                      <TableCell className={`${tdClass} text-center`}>{u.ipPhone || ''}</TableCell>
                      <TableCell className={`${tdClass} ${tdHidden} text-center`}>{u.mobile || ''}</TableCell>
                      <TableCell className={`${tdClass} text-center break-all`}>{u.mail || ''}</TableCell>
                      <TableCell className={`${tdClass} ${tdHidden}`}>{u.title || ''}</TableCell>
                      <TableCell className={`${tdClass} ${tdHidden}`}>{u.department || u.departmentNumber || ''}</TableCell>
                    </TableRow>
                    {isExpanded && details.length > 0 && (
                      <TableRow className="xl:hidden bg-muted/30">
                        <TableCell colSpan={4} className="p-2 text-xs">
                          <div className="space-y-1">
                            {details.map((d) => (
                              <div key={d.label} className="flex flex-col">
                                <span className="text-muted-foreground whitespace-normal">{d.label}</span>
                                <span className="break-all whitespace-normal my-1">{d.value}</span>
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
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity text-sm cursor-pointer"
            >
              <ArrowUp className="h-4 w-4" />
              Наверх
            </button>
          )}
        </div>
      )}
    </div>
  );
}



