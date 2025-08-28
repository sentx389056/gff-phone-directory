"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Upload } from "lucide-react";
// CSV utils
function usersToCSV(users: User[]): string {
    const header = ["uid", "cn", "mail", "telephoneNumber", "mobile", "title", "departmentNumber"];
    // Добавляем пробел только к числовым полям для Excel
    const numericFields = new Set(["telephoneNumber", "mobile", "departmentNumber"]);
    const escape = (val: string, key: string) => {
        if (!val) return '""';
        let v = val.replace(/"/g, '""');
        if (numericFields.has(key) && v) v = ' ' + v; // только для числовых полей
        return '"' + v + '"';
    };
    const rows = users.map(u => header.map(h => escape(u[h as keyof User]?.toString() ?? "", h)));
    // BOM + sep=; + заголовки + данные
    return '\uFEFFsep=;\r\n' + header.join(";") + '\r\n' + rows.map(r => r.join(";")).join("\r\n");
}

function csvToUsers(csv: string): User[] {
    let lines = csv.trim().split(/\r?\n/);
    let delimiter = ',';
    if (lines[0].toLowerCase().startsWith('sep=')) {
        delimiter = lines[0].slice(4, 5);
        lines = lines.slice(1);
    }
    const [headerLine, ...dataLines] = lines;
    const header = headerLine.split(delimiter).map(h => h.replace(/^"|"$/g, ""));
    function smartSplit(line: string, delim: string): string[] {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"'; i++; // escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delim && !inQuotes) {
                result.push(cur); cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur);
        return result;
    }
    return dataLines
        .map(line => line.replace(/^\uFEFF/, '')) // убрать BOM если есть
        .filter(line => line.trim().length > 0 && /[\wа-яА-ЯёЁ]/.test(line)) // пропускать пустые строки
        .map(line => {
            const fields = smartSplit(line, delimiter).map(f => f.replace(/^"|"$/g, "").replace(/""/g, '"'));
            while (fields.length < header.length) fields.push("");
            const u: any = {};
            header.forEach((h, i) => u[h] = fields[i] || "");
            return u as User;
        });
}
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface User {
    uid: string;
    cn: string;
    mail?: string;
    telephoneNumber?: string;
    mobile?: string;
    title?: string;
    departmentNumber?: string;
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (!res.ok) {
                    router.replace("/");
                    return;
                }
            } finally {
                setLoading(false);
            }
        };
        check();
    }, [router]);

    useEffect(() => {
        if (!loading) {
            fetchUsers();
        }
        async function fetchUsers() {
            try {
                const res = await fetch("/api/users");
                const data = await res.json();
                setUsers(data.users || []);
            } catch { }
        }
    }, [loading]);

    const handleEdit = (idx: number) => {
        setEditIdx(idx);
        setEditUser({ ...users[idx] });
    };

    const handleCancel = () => {
        setEditIdx(null);
        setEditUser(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editUser) return;
        setEditUser({ ...editUser, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (editIdx === null || !editUser) return;
        setSaving(true);
        try {
            const res = await fetch("/api/users/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editUser),
            });
            if (res.ok) {
                const updated = [...users];
                updated[editIdx] = editUser;
                setUsers(updated);
                setEditIdx(null);
                setEditUser(null);
                toast.success("Изменения успешно сохранены");
            } else {
                toast.error("Ошибка сохранения сотрудника");
            }
        } catch {
            toast.error("Ошибка сети при сохранении");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="relative p-5">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>uid</TableHead>
                        <TableHead>ФИО</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Мобильный</TableHead>
                        <TableHead>Должность</TableHead>
                        <TableHead>Подразделение</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20 bg-muted/60 dark:bg-muted/30" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="absolute inset-0 bg-white/70 dark:bg-black/30 z-10 pointer-events-none rounded-xl" />
        </div>
    );

    return (
        <div className="p-5">
            <Toaster position="top-right" richColors closeButton />
            <div className="flex items-center gap-4 mb-4">
                <button
                    type="button"
                    title="Экспорт CSV"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-background text-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                        const csv = usersToCSV(users);
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'users.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    <Download size={16} /> Экспорт
                </button>
                <label className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-background text-foreground hover:bg-accent transition-colors cursor-pointer">
                    <Upload size={16} /> Импорт
                    <input type="file" accept=".csv" className="hidden"
                        onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const text = await file.text();
                            let imported: User[] = [];
                            try {
                                imported = csvToUsers(text);
                            } catch {
                                toast.error('Ошибка разбора CSV');
                                return;
                            }
                            if (!imported.length) {
                                toast.error('Нет данных для импорта');
                                return;
                            }
                            // Сохраняем на сервере
                            try {
                                const res = await fetch('/api/users/import', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(imported)
                                });
                                const result = await res.json();
                                if (!res.ok) {
                                    toast.error('Ошибка сохранения: ' + (result.error || res.status));
                                    return;
                                }
                                // Показать подробный результат
                                if (result.results && Array.isArray(result.results)) {
                                    const created = result.results.filter((r: any) => r.status === 'created').length;
                                    const updated = result.results.filter((r: any) => r.status === 'updated').length;
                                    const errors = result.results.filter((r: any) => r.status === 'error');
                                    toast.info(`Создано: ${created}, обновлено: ${updated}${errors.length ? ', ошибок: ' + errors.length : ''}`);
                                    if (errors.length) {
                                        errors.forEach((e: any) => toast.error(`Ошибка для ${e.cn}: ${e.error}`));
                                    }
                                } else {
                                    toast.success('Импортировано сотрудников: ' + imported.length);
                                }
                                // Обновить таблицу с сервера
                                const usersRes = await fetch('/api/users');
                                const usersData = await usersRes.json();
                                setUsers(usersData.users || []);
                            } catch (err) {
                                toast.error('Ошибка сохранения на сервере');
                            }
                        }}
                    />
                </label>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>uid</TableHead>
                        <TableHead>ФИО</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Мобильный</TableHead>
                        <TableHead>Должность</TableHead>
                        <TableHead>Подразделение</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((u, i) => (
                        <TableRow key={i}>
                            {editIdx === i ? (
                                <>
                                    <TableCell>
                                        <Input name="uid" value={editUser?.uid || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="cn" value={editUser?.cn || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="mail" value={editUser?.mail || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="telephoneNumber" value={editUser?.telephoneNumber || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="mobile" value={editUser?.mobile || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="title" value={editUser?.title || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="departmentNumber" value={editUser?.departmentNumber || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Button onClick={handleSave} disabled={saving}>Сохранить</Button>
                                        <Button variant="secondary" onClick={handleCancel} disabled={saving}>Отмена</Button>
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>{u.uid || "—"}</TableCell>
                                    <TableCell>{u.cn || "—"}</TableCell>
                                    <TableCell>{u.mail || "—"}</TableCell>
                                    <TableCell>{u.telephoneNumber || "—"}</TableCell>
                                    <TableCell>{u.mobile || "—"}</TableCell>
                                    <TableCell>{u.title || "—"}</TableCell>
                                    <TableCell>{u.departmentNumber || "—"}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="outline" onClick={() => handleEdit(i)}>Редактировать</Button>
                                        <Button variant="destructive" onClick={async () => {
                                            if (!window.confirm(`Удалить пользователя ${u.cn}?`)) return;
                                            try {
                                                const res = await fetch('/api/users/delete', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ uid: u.uid, cn: u.cn })
                                                });
                                                if (!res.ok) {
                                                    const err = await res.json();
                                                    toast.error('Ошибка удаления: ' + (err.error || res.status));
                                                    return;
                                                }
                                                toast.success('Пользователь удалён');
                                                // Обновить таблицу
                                                const usersRes = await fetch('/api/users');
                                                const usersData = await usersRes.json();
                                                setUsers(usersData.users || []);
                                            } catch {
                                                toast.error('Ошибка удаления на сервере');
                                            }
                                        }}>Удалить</Button>
                                    </TableCell>
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}