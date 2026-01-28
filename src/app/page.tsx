"use client";

import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from '@radix-ui/react-separator';

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

  const fetchUsers = async (searchValue = "") => {
    setLoading(true);
    try {
      const url = searchValue ? `/api/users?search=${encodeURIComponent(searchValue)}` : '/api/users';
      const res = await fetch(url);
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

  useEffect(() => {
    fetchUsers(search);
  }, [search]);

  if (loading) return (
    <div className="">
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
              <TableHead>Доб. телефон</TableHead>
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
    </div>
  );

  return (
    <div className="p-5">
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') fetchUsers(search); }}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
      />
      {error ? (
        <p>{error}</p>
      ) : users.length === 0 ? (
        <p>Пользователи не найдены</p>
      ) : (
        <div className="w-full overflow-x-auto max-h-[85vh]">
          <Table className="">
            <TableHeader className=''>
              <TableRow>
                <TableHead className='border bg-accent/50'>ФИО</TableHead>
                <TableHead className='border bg-accent/50'>Телефон</TableHead>
                <TableHead className='border bg-accent/50'>Доб. телефон</TableHead>
                <TableHead className='border bg-accent/50'>Мобильный</TableHead>
                <TableHead className='border bg-accent/50'>Email</TableHead>
                <TableHead className='border bg-accent/50'>Должность</TableHead>
                <TableHead className='border bg-accent/50'>Подразделение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className='border'>{u.displayName || u.cn || u.sn || ''}</TableCell>
                  <TableCell className='border'>{u.telephoneNumber || ''}</TableCell>
                  <TableCell className='border'>{u.ipPhone || ''}</TableCell>
                  <TableCell className='border'>{u.mobile || ''}</TableCell>
                  <TableCell className='border'>{u.mail || ''}</TableCell>
                  <TableCell className='border'>{u.title || ''}</TableCell>
                  <TableCell className="border whitespace-normal ">{u.department || u.departmentNumber || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}



