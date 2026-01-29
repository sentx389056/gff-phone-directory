"use client";

import { useEffect, useState, useMemo } from 'react';
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

  return (
    <div className="p-5">
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
      />
      {loading ? (
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
      ) : error ? (
        <p>{error}</p>
      ) : filteredUsers.length === 0 ? (
        <p>Пользователи не найдены</p>
      ) : (
        <div className="w-full overflow-auto max-h-[84vh]">
          <Table className="">
            <TableHeader>
              <TableRow>
                <TableHead className='border bg-accent sticky top-0 z-10'>ФИО</TableHead>
                <TableHead className='border bg-accent sticky top-0 z-10'>Телефон</TableHead>
                <TableHead className='border bg-accent sticky top-0 z-10'>Доб. телефон</TableHead>
                <TableHead className='border bg-accent sticky top-0 z-10'>Мобильный</TableHead>
                <TableHead className='border bg-accent sticky top-0 z-10'>Email</TableHead>
                <TableHead className='border bg-accent sticky top-0 z-10'>Должность</TableHead>
                <TableHead className='border bg-accent sticky top-0 z-10'>Подразделение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u, i) => (
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



