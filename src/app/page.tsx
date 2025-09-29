"use client";

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  cn: string
  uid: string;
  sn: string;
  mail?: string;
  telephoneNumber?: string;
  mobile?: string;
  title?: string;
  departmentNumber?: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async (searchValue = "") => {
    setLoading(true);
    try {
      const url = searchValue ? `/api/users?search=${encodeURIComponent(searchValue)}` : '/api/users';
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, [search]);

  if (loading) return (
    <div className="p-4 sm:p-6 md:p-8 relative">
      <h2>Сотрудники</h2>
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
      />
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>ФИО</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Мобильный</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Подразделение</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(6)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24 bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="absolute inset-0 bg-white/70 dark:bg-black/30 z-10 pointer-events-none rounded-xl" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h2>Сотрудники</h2>
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') fetchUsers(search); }}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
      />
      {users.length === 0 ? (
        <p>Пользователи не найдены</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Мобильный</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead>Подразделение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={i}>
                  <TableCell>{u.sn || '—'}</TableCell>
                  <TableCell>{u.telephoneNumber || '—'}</TableCell>
                  <TableCell>{u.mobile || '—'}</TableCell>
                  <TableCell>{u.mail || '—'}</TableCell>
                  <TableCell>{u.title || '—'}</TableCell>
                  <TableCell>{u.departmentNumber || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}



